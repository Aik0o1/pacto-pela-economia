import json

with open('/home/victor/JUCEPI-DEV/mapa-piaui-react/front/src/assets/piaui_municipios.json', 'r') as f:
    geojson = json.load(f)

with open('/home/victor/JUCEPI-DEV/mapa-piaui-react/front/src/assets/municipios_regioes.json', 'r') as f:
    regioes = json.load(f)

geojson_names = set()
for feature in geojson['features']:
    # The GeoJSON properties might have 'name' or 'NOME' or 'nm_mun' depending on source.
    # Based on previous `head`, I saw `name` wasn't there but I need to check properties.
    # Actually, looking at previous output, I saw `codarea` but not the name in the snippet.
    # Let's assume standard IBGE structure often has `NM_MUN` or similar.
    # I'll print keys first to be sure in previous steps, but I'll try to just inspect the file structure structure more.
    # Wait, I saw "properties": {"codarea": "2211001"} in the head output. NO NAME?
    # IF NO NAME IN GEOJSON, I HAVE A BIG PROBLEM.
    # Let me check if there are other properties.
    pass

# Actually, if the GeoJSON ONLY has `codarea`, I rely ONLY on `cidades` prop passed to MapLeaflet.
# In MapLeaflet.jsx, I use `cidades` prop to map ID -> Name.
# So I should check if `cidades` list (from API) matches `municipios_regioes.json` keys.

# But I can't check the API response easily here without running curl against the API which requires auth.
# However, I have `municipios_regioes.json` which has names.
# I can try to find a list of 224 cities of Piaui online or just use the python script to check if I can find the missing one by count/logic if I had a reference.

# Better approach:
# I will check `piaui_municipios.json` again. If it only has `codarea`, then `MapLeaflet` relies on `cidades` prop.
# If `cidades` prop comes from API, maybe the API has the mismatch?
# But `regioes` uses NAMES as keys.
# So if the API returns "Parnaíba" and regions has "Parnaíba", it works.
# If API returns "Assunção do Piauí" and regions has "Assuncao do Piaui", it fails (but I added normalization).

# I need to find which city is missing from `municipios_regioes.json`.
# I will lists all keys in `municipios_regioes.json` and sort them, maybe I can spot it? No.
# I will use a known list of 224 cities (I don't have one handy).
# I will search specifically for "missing city piaui list" or similar? No.

# Let's check the API data `id_nome_cidades` if possible.
pass
