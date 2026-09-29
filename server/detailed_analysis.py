import csv, re

with open('hospitals.csv', mode='r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

# Let's inspect rows where address has multiple addresses, multiple cities, or multiple states
# What are the patterns?
# Pattern A: Address concatenation with huge spaces, e.g. "addr1        addr2"
# Pattern B: Multiple "( City - X ) ... ( City - Y )" or similar
# Pattern C: State is wrong for city (e.g. Bangalore, Andhra Pradesh)
# Pattern D: What if a hospital has two distinct addresses separated by comma or semicolon?
# Pattern E: Empty/almost empty address like ",Bengaluru,Karnataka ,560034"
# Pattern F: Multiple pincodes in the address

print(f"Total rows: {len(rows)}")

pattern_multi_city_brackets = []
pattern_spaces = []
pattern_two_states = []
pattern_two_pincodes = []

# List of known Indian states
states_list = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Chandigarh', 'Delhi', 'Jammu & Kashmir', 'Jammu and Kashmir', 'Puducherry'
]
state_regex = re.compile(r'\b(' + '|'.join([re.escape(s) for s in states_list]) + r')\b', re.I)

for idx, r in enumerate(rows):
    addr = r['address']
    # 1. Multiple city tags
    cities_in_parens = re.findall(r'\(?\s*city\s*-\s*([^)]+)\)?', addr, re.I)
    if len(cities_in_parens) > 1:
        pattern_multi_city_brackets.append((idx, r, cities_in_parens))
        
    # 2. Huge spaces
    if re.search(r'\s{4,}', addr):
        pattern_spaces.append((idx, r))
        
    # 3. Two different states mentioned
    st_matches = set([m.group(0).lower() for m in state_regex.finditer(addr)])
    # normalize jammu & kashmir vs jammu and kashmir
    st_norm = set()
    for s in st_matches:
        st_norm.add(s.replace('&', 'and'))
    if len(st_norm) > 1:
        pattern_two_states.append((idx, r, st_norm))
        
    # 4. Two distinct 6-digit pincodes
    pins = set(re.findall(r'\b\d{6}\b', addr))
    if len(pins) > 1:
        pattern_two_pincodes.append((idx, r, pins))

print(f"Pattern A (Multi city tags): {len(pattern_multi_city_brackets)}")
print(f"Pattern B (Huge spaces): {len(pattern_spaces)}")
print(f"Pattern C (Two distinct states in address): {len(pattern_two_states)}")
print(f"Pattern D (Two distinct pincodes): {len(pattern_two_pincodes)}")

# Union of all problematic rows:
all_problem_indices = set(
    [x[0] for x in pattern_multi_city_brackets] +
    [x[0] for x in pattern_spaces] +
    [x[0] for x in pattern_two_states] +
    [x[0] for x in pattern_two_pincodes]
)
print(f"Total unique rows flagged by these patterns: {len(all_problem_indices)}")
