import json
from collections import Counter

with open('/home/victor/JUCEPI-DEV/mapa-piaui-react/front/src/assets/municipios_regioes.json', 'r') as f:
    data = json.load(f)

counts = Counter(data.values())

print(f"Total: {len(data)}")
for region, count in counts.most_common():
    print(f"{region}: {count}")
