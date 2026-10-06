# baseline.py
"""
Baselines para EconoFold.
Compara 3 métodos para predecir activaciones de RCA:
  1. Persistencia (M(t) como predicción de M(t+5))
  2. Density (Product Space)
  3. XGBoost con features estructurales

Split: leave-k-countries-out (20 países held-out)
Target: activaciones = (M(t)=0) AND (M(t+5)=1) AND (RCA(t) < 0.25)
"""
import duckdb
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import f1_score, average_precision_score
import warnings
warnings.filterwarnings('ignore')

# ============= CONFIG =============
DB = 'econofold.duckdb'
TRAIN_PAIRS = [(1995, 2000), (2000, 2005), (2005, 2010), (2010, 2015)]
VAL_PAIR = (2015, 2020)
TEST_PAIR = (2019, 2024)
N_HELD_OUT = 20
RANDOM_SEED = 42
RCA_ACTIVATION_THRESHOLD = 0.25  # un par es "activación" si RCA_t < 0.25 y M_t5 = 1

np.random.seed(RANDOM_SEED)

con = duckdb.connect(DB)
print("Conectado a", DB)

# ============= 1. CARGAR M Y RCA =============
print("\n[1/5] Cargando M y RCA...")

# Países held-out
all_countries = con.execute("""
SELECT DISTINCT country FROM rca_binary
""").df()['country'].tolist()
held_out = set(np.random.choice(all_countries, N_HELD_OUT, replace=False))
print(f"  Países held-out: {len(held_out)}")
print(f"  Ejemplos: {sorted(list(held_out))[:5]}")

# Cargar RCA completo (necesitamos el valor continuo)
df_rca = con.execute("""
SELECT year, country, product, rca
FROM rca_matrix
WHERE year IN (1995, 2000, 2005, 2010, 2015, 2019, 2020, 2024)
""").df()
print(f"  Filas RCA: {len(df_rca):,}")

# ============= 2. PRODUCT SPACE (density) =============
print("\n[2/5] Cargando product proximity...")
df_prox = con.execute("""
SELECT p1, p2, proximity FROM product_proximity WHERE proximity > 0
""").df()
print(f"  Pares de productos: {len(df_prox):,}")

# ============= 3. CONSTRUIR FEATURES =============
print("\n[3/5] Construyendo features...")

def build_features(t, t5):
    """Construye features para predecir M(t+5) desde M(t)."""
    # RCA en t y t+5
    rca_t = df_rca[df_rca['year'] == t][['country', 'product', 'rca']].copy()
    rca_t5 = df_rca[df_rca['year'] == t5][['country', 'product', 'rca']].copy()
    rca_t.columns = ['country', 'product', 'rca_t']
    rca_t5.columns = ['country', 'product', 'rca_t5']

    # M en t
    rca_t['m_t'] = (rca_t['rca_t'] > 1).astype(int)

    # Merge
    df = rca_t.merge(rca_t5, on=['country', 'product'], how='outer')
    df['rca_t'] = df['rca_t'].fillna(0)
    df['rca_t5'] = df['rca_t5'].fillna(0)
    df['m_t'] = df['m_t'].fillna(0).astype(int)

    # Target: activación
    # (M_t = 0) AND (M_t5 = 1) AND (RCA_t < 0.25)
    df['m_t5'] = (df['rca_t5'] > 1).astype(int)
    df['activation'] = ((df['m_t'] == 0) & (df['m_t5'] == 1) & (df['rca_t'] < RCA_ACTIVATION_THRESHOLD)).astype(int)

    # Feature 1: Density
    # Para cada (país, producto): suma de proximidades a productos que el país ya exporta
    print(f"    Calculando density para {t}→{t5}...")
    m_t = df[df['m_t'] == 1][['country', 'product']].copy()
    m_t.columns = ['country', 'product_j']

    # Merge con proximity: para cada (country, product_j) activo, todos los product_k con proximidad
    prox = df_prox.rename(columns={'p1': 'product_j', 'p2': 'product_k'})
    m_expanded = m_t.merge(prox, on='product_j', how='inner')

    # Suma de proximidades por (country, product_k)
    density_num = m_expanded.groupby(['country', 'product_k'])['proximity'].sum().reset_index()
    density_num.columns = ['country', 'product', 'sum_prox']

    # Denominador: suma total de proximidades para cada producto
    total_prox = df_prox.groupby('p2')['proximity'].sum().reset_index()
    total_prox.columns = ['product', 'total_prox']

    density = density_num.merge(total_prox, on='product', how='left')
    density['density'] = density['sum_prox'] / density['total_prox']

    df = df.merge(density[['country', 'product', 'density']], on=['country', 'product'], how='left')
    df['density'] = df['density'].fillna(0)

    # Feature 2: ECI del país (proxy: nº de productos con RCA>1)
    eci = df[df['m_t'] == 1].groupby('country').size().reset_index()
    eci.columns = ['country', 'eci_proxy']
    df = df.merge(eci, on='country', how='left')
    df['eci_proxy'] = df['eci_proxy'].fillna(0)

    # Feature 3: PCI del producto (proxy: nº de países que exportan)
    pci = df[df['m_t'] == 1].groupby('product').size().reset_index()
    pci.columns = ['product', 'pci_proxy']
    df = df.merge(pci, on='product', how='left')
    df['pci_proxy'] = df['pci_proxy'].fillna(0)

    # Feature 4: RCA_t (para activaciones cercanas)
    df['rca_t_log'] = np.log1p(df['rca_t'] * 10)

    df['t'] = t
    df['t5'] = t5
    return df

# Construir todos los pares
dfs = []
for t, t5 in TRAIN_PAIRS + [VAL_PAIR, TEST_PAIR]:
    print(f"  Par {t}→{t5}")
    dfs.append(build_features(t, t5))

df_all = pd.concat(dfs, ignore_index=True)
print(f"  Total filas: {len(df_all):,}")
print(f"  Activaciones totales: {df_all['activation'].sum():,}")

# ============= 4. SPLIT =============
print("\n[4/5] Split train/val/test...")

# Train: pares de train, países no held-out
train_pairs = TRAIN_PAIRS
df_train = df_all[
    (df_all[['t', 't5']].apply(tuple, axis=1).isin(train_pairs)) &
    (~df_all['country'].isin(held_out))
].copy()

# Val: VAL_PAIR, países no held-out
df_val = df_all[
    (df_all['t'] == VAL_PAIR[0]) & (df_all['t5'] == VAL_PAIR[1]) &
    (~df_all['country'].isin(held_out))
].copy()

# Test: TEST_PAIR, países held-out
df_test = df_all[
    (df_all['t'] == TEST_PAIR[0]) & (df_all['t5'] == TEST_PAIR[1]) &
    (df_all['country'].isin(held_out))
].copy()

print(f"  Train: {len(df_train):,} filas ({df_train['activation'].sum():,} activaciones)")
print(f"  Val:   {len(df_val):,} filas ({df_val['activation'].sum():,} activaciones)")
print(f"  Test:  {len(df_test):,} filas ({df_test['activation'].sum():,} activaciones)")

FEATURES = ['density', 'eci_proxy', 'pci_proxy', 'rca_t_log', 'm_t']

# ============= 5. MÉTRICAS =============
print("\n[5/5] Evaluando baselines...")

def precision_at_k(y_true, y_score, k=1000):
    """Precision en el top-k de scores más altos."""
    if len(y_true) < k:
        k = len(y_true)
    idx = np.argsort(y_score)[::-1][:k]
    return y_true.iloc[idx].mean() if hasattr(y_true, 'iloc') else y_true[idx].mean()

def mAP_at_k(y_true, y_score, k=10):
    """Mean Average Precision en el top-k."""
    y_true = np.asarray(y_true)
    y_score = np.asarray(y_score)
    idx = np.argsort(y_score)[::-1][:k]
    y_top = y_true[idx]
    precisions = np.cumsum(y_top) / (np.arange(len(y_top)) + 1)
    return (precisions * y_top).sum() / max(y_top.sum(), 1)

def evaluate(name, df_test, scores):
    y = df_test['activation'].values
    # BestF1: barremos umbrales
    thresholds = np.percentile(scores, np.arange(50, 100, 2))
    best_f1 = 0
    for th in thresholds:
        preds = (scores >= th).astype(int)
        f1 = f1_score(y, preds, zero_division=0)
        best_f1 = max(best_f1, f1)

    p1000 = precision_at_k(y, scores, k=min(1000, len(y)))
    m10 = mAP_at_k(y, scores, k=min(10, len(y)))

    print(f"\n  --- {name} ---")
    print(f"    BestF1:      {best_f1:.4f}")
    print(f"    Prec@1000:   {p1000:.4f}")
    print(f"    mAP@10:      {m10:.4f}")
    return {'name': name, 'best_f1': best_f1, 'p1000': p1000, 'map10': m10}

results = []

# Baseline 1: Persistencia
# Predice M(t+5) = M(t). Para "activation", puntúa con density (0 si no hay info).
print("\n[B1] Persistencia")
scores_persist = df_test['m_t'].values.astype(float)
results.append(evaluate('Persistencia', df_test, scores_persist))

# Baseline 2: Density
print("\n[B2] Product Space Density")
scores_density = df_test['density'].values
results.append(evaluate('Density', df_test, scores_density))

# Baseline 3: XGBoost
print("\n[B3] XGBoost")
X_train = df_train[FEATURES].values
y_train = df_train['activation'].values
X_val = df_val[FEATURES].values
y_val = df_val['activation'].values
X_test = df_test[FEATURES].values

scale_pos = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    scale_pos_weight=scale_pos,
    tree_method='hist',
    random_state=RANDOM_SEED,
    n_jobs=-1,
)
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

scores_xgb = model.predict_proba(X_test)[:, 1]
results.append(evaluate('XGBoost', df_test, scores_xgb))

# Feature importance
print("\n  Feature importance:")
for f, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
    print(f"    {f:15s}: {imp:.4f}")

# ============= RESUMEN =============
print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)
df_res = pd.DataFrame(results)
print(df_res.to_string(index=False))

con.close()
print("\n✓ Baselines completados.")