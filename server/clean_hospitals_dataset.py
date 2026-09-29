#!/usr/bin/env python3
"""
clean_hospitals_dataset.py
--------------------------
Comprehensive dataset cleaner, tier normalizer & deduplicator for:
- hospitals.csv
- cost/hospitals.csv
- cost/data/hospitals.csv

Tasks performed:
1. Removes unrecoverable corrupted fragments, pincode-only rows, and bogus mismatch duplicates.
2. De-concatenates and cleans two-column OCR spliced / multi-address entries across all cities.
3. Eliminates OCR junk like '(City - X) ,X,State ,Pincode'.
4. Normalizes locality & sub-city formatting for ALL major metro cities (Mumbai, Delhi, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Bengaluru, etc.).
5. Corrects wrong state mappings across India based on true city location.
6. Enriches generic stub addresses (e.g. "telangana", "pratapgarh, uttar pradesh") using facility town from hospital names.
7. Deduplicates records with identical addresses by merging insurer networks, keeping the best rating, and retaining the most complete hospital details.
8. Authoritatively assigns canonical Tiers (Metro 1, Metro 2, Large City 1, Large City 2, City 1, City 2, Town 1, Town 2) based on the hospital's true city across all cities in India.
9. Writes cleaned datasets to all target files and generates an audit report.
"""

import csv
import json
import os
import re
import sys
from collections import Counter

# Set of valid Indian states
INDIAN_STATES = {
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
}

# Major cities canonical state mapping
CITY_TO_STATE = {
    'bangalore': ('Bengaluru', 'Karnataka'),
    'bengaluru': ('Bengaluru', 'Karnataka'),
    'bengaluru rural': ('Bengaluru Rural', 'Karnataka'),
    'hyderabad': ('Hyderabad', 'Telangana'),
    'secunderabad': ('Hyderabad', 'Telangana'),
    'chennai': ('Chennai', 'Tamil Nadu'),
    'mumbai': ('Mumbai', 'Maharashtra'),
    'pune': ('Pune', 'Maharashtra'),
    'delhi': ('Delhi', 'Delhi'),
    'new delhi': ('Delhi', 'Delhi'),
    'kolkata': ('Kolkata', 'West Bengal'),
    'ahmedabad': ('Ahmedabad', 'Gujarat'),
    'jaipur': ('Jaipur', 'Rajasthan'),
    'surat': ('Surat', 'Gujarat'),
    'lucknow': ('Lucknow', 'Uttar Pradesh'),
    'kanpur': ('Kanpur', 'Uttar Pradesh'),
    'nagpur': ('Nagpur', 'Maharashtra'),
    'indore': ('Indore', 'Madhya Pradesh'),
    'thane': ('Thane', 'Maharashtra'),
    'bhopal': ('Bhopal', 'Madhya Pradesh'),
    'visakhapatnam': ('Visakhapatnam', 'Andhra Pradesh'),
    'vizag': ('Visakhapatnam', 'Andhra Pradesh'),
    'patna': ('Patna', 'Bihar'),
    'vadodara': ('Vadodara', 'Gujarat'),
    'ghaziabad': ('Ghaziabad', 'Uttar Pradesh'),
    'ludhiana': ('Ludhiana', 'Punjab'),
    'agra': ('Agra', 'Uttar Pradesh'),
    'nashik': ('Nashik', 'Maharashtra'),
    'faridabad': ('Faridabad', 'Haryana'),
    'meerut': ('Meerut', 'Uttar Pradesh'),
    'rajkot': ('Rajkot', 'Gujarat'),
    'varanasi': ('Varanasi', 'Uttar Pradesh'),
    'srinagar': ('Srinagar', 'Jammu and Kashmir'),
    'aurangabad': ('Aurangabad', 'Maharashtra'),
    'amritsar': ('Amritsar', 'Punjab'),
    'navi mumbai': ('Navi Mumbai', 'Maharashtra'),
    'coimbatore': ('Coimbatore', 'Tamil Nadu'),
    'madurai': ('Madurai', 'Tamil Nadu'),
    'chandigarh': ('Chandigarh', 'Chandigarh'),
    'kochi': ('Kochi', 'Kerala'),
    'cochin': ('Kochi', 'Kerala'),
    'gurugram': ('Gurugram', 'Haryana'),
    'gurgaon': ('Gurugram', 'Haryana'),
    'noida': ('Noida', 'Uttar Pradesh'),
    'mysore': ('Mysuru', 'Karnataka'),
    'mysuru': ('Mysuru', 'Karnataka'),
    'guntur': ('Guntur', 'Andhra Pradesh'),
    'vijayawada': ('Vijayawada', 'Andhra Pradesh'),
    'tirupati': ('Tirupati', 'Andhra Pradesh'),
    'jabalpur': ('Jabalpur', 'Madhya Pradesh'),
    'gwalior': ('Gwalior', 'Madhya Pradesh'),
    'jodhpur': ('Jodhpur', 'Rajasthan'),
    'raipur': ('Raipur', 'Chhattisgarh'),
    'guwahati': ('Guwahati', 'Assam'),
    'dehradun': ('Dehradun', 'Uttarakhand'),
    'shimla': ('Shimla', 'Himachal Pradesh'),
    'hubli': ('Hubballi', 'Karnataka'),
    'hubballi': ('Hubballi', 'Karnataka'),
    'mangalore': ('Mangaluru', 'Karnataka'),
    'mangaluru': ('Mangaluru', 'Karnataka'),
    'belgaum': ('Belagavi', 'Karnataka'),
    'belagavi': ('Belagavi', 'Karnataka'),
    'davanagere': ('Davanagere', 'Karnataka'),
    'bellary': ('Ballari', 'Karnataka'),
    'ballari': ('Ballari', 'Karnataka'),
    'shimoga': ('Shivamogga', 'Karnataka'),
    'shivamogga': ('Shivamogga', 'Karnataka'),
    'tumkur': ('Tumakuru', 'Karnataka'),
    'tumakuru': ('Tumakuru', 'Karnataka'),
    'hosur': ('Hosur', 'Tamil Nadu'),
    'salem': ('Salem', 'Tamil Nadu')
}

# Locality to canonical city mapping for all major metro cities
METRO_LOCALITIES = {
    # Mumbai / MMR -> Mumbai / Navi Mumbai / Thane
    'andheri': ('Mumbai', 'Maharashtra'),
    'bandra': ('Mumbai', 'Maharashtra'),
    'borivali': ('Mumbai', 'Maharashtra'),
    'dadar': ('Mumbai', 'Maharashtra'),
    'malad': ('Mumbai', 'Maharashtra'),
    'goregaon': ('Mumbai', 'Maharashtra'),
    'ghatkopar': ('Mumbai', 'Maharashtra'),
    'kurla': ('Mumbai', 'Maharashtra'),
    'chembur': ('Mumbai', 'Maharashtra'),
    'mulund': ('Mumbai', 'Maharashtra'),
    'kandivali': ('Mumbai', 'Maharashtra'),
    'powai': ('Mumbai', 'Maharashtra'),
    'juhu': ('Mumbai', 'Maharashtra'),
    'worli': ('Mumbai', 'Maharashtra'),
    'byculla': ('Mumbai', 'Maharashtra'),
    'colaba': ('Mumbai', 'Maharashtra'),
    'santacruz': ('Mumbai', 'Maharashtra'),
    'vashi': ('Navi Mumbai', 'Maharashtra'),
    'panvel': ('Navi Mumbai', 'Maharashtra'),
    'kharghar': ('Navi Mumbai', 'Maharashtra'),
    'nerul': ('Navi Mumbai', 'Maharashtra'),
    'belapur': ('Navi Mumbai', 'Maharashtra'),
    'airoli': ('Navi Mumbai', 'Maharashtra'),
    'kalyan': ('Thane', 'Maharashtra'),
    'dombivli': ('Thane', 'Maharashtra'),
    'mira road': ('Thane', 'Maharashtra'),
    'bhayandar': ('Thane', 'Maharashtra'),
    'bhiwandi': ('Thane', 'Maharashtra'),
    'ulhasnagar': ('Thane', 'Maharashtra'),
    
    # Delhi NCR -> Delhi
    'dwarka': ('Delhi', 'Delhi'),
    'rohini': ('Delhi', 'Delhi'),
    'pitampura': ('Delhi', 'Delhi'),
    'janakpuri': ('Delhi', 'Delhi'),
    'karol bagh': ('Delhi', 'Delhi'),
    'lajpat nagar': ('Delhi', 'Delhi'),
    'saket': ('Delhi', 'Delhi'),
    'vasant kunj': ('Delhi', 'Delhi'),
    'laxmi nagar': ('Delhi', 'Delhi'),
    'connaught place': ('Delhi', 'Delhi'),
    'shahdara': ('Delhi', 'Delhi'),
    'mayur vihar': ('Delhi', 'Delhi'),
    'paschim vihar': ('Delhi', 'Delhi'),
    'shalimar bagh': ('Delhi', 'Delhi'),
    'rajouri garden': ('Delhi', 'Delhi'),
    'noida': ('Noida', 'Uttar Pradesh'),
    'greater noida': ('Greater Noida', 'Uttar Pradesh'),
    'indirapuram': ('Ghaziabad', 'Uttar Pradesh'),
    'vaishali': ('Ghaziabad', 'Uttar Pradesh'),
    'gurgaon': ('Gurugram', 'Haryana'),
    'gurugram': ('Gurugram', 'Haryana'),
    'faridabad': ('Faridabad', 'Haryana'),

    # Hyderabad
    'secunderabad': ('Hyderabad', 'Telangana'),
    'banjara hills': ('Hyderabad', 'Telangana'),
    'jubilee hills': ('Hyderabad', 'Telangana'),
    'hitec city': ('Hyderabad', 'Telangana'),
    'gachibowli': ('Hyderabad', 'Telangana'),
    'kukatpally': ('Hyderabad', 'Telangana'),
    'madhapur': ('Hyderabad', 'Telangana'),
    'begumpet': ('Hyderabad', 'Telangana'),
    'ameerpet': ('Hyderabad', 'Telangana'),
    'dilsukhnagar': ('Hyderabad', 'Telangana'),
    'kondapur': ('Hyderabad', 'Telangana'),
    'malkajgiri': ('Hyderabad', 'Telangana'),
    'uppal': ('Hyderabad', 'Telangana'),
    'lb nagar': ('Hyderabad', 'Telangana'),
    'miyapur': ('Hyderabad', 'Telangana'),
    
    # Chennai
    'anna nagar': ('Chennai', 'Tamil Nadu'),
    't nagar': ('Chennai', 'Tamil Nadu'),
    'adyar': ('Chennai', 'Tamil Nadu'),
    'velachery': ('Chennai', 'Tamil Nadu'),
    'mylapore': ('Chennai', 'Tamil Nadu'),
    'guindy': ('Chennai', 'Tamil Nadu'),
    'tambaram': ('Chennai', 'Tamil Nadu'),
    'chromepet': ('Chennai', 'Tamil Nadu'),
    'porur': ('Chennai', 'Tamil Nadu'),
    'kilpauk': ('Chennai', 'Tamil Nadu'),
    'nungambakkam': ('Chennai', 'Tamil Nadu'),
    'vadapalani': ('Chennai', 'Tamil Nadu'),
    'royapettah': ('Chennai', 'Tamil Nadu'),
    
    # Kolkata
    'salt lake': ('Kolkata', 'West Bengal'),
    'new town': ('Kolkata', 'West Bengal'),
    'howrah': ('Howrah', 'West Bengal'),
    'park street': ('Kolkata', 'West Bengal'),
    'ballygunge': ('Kolkata', 'West Bengal'),
    'alipore': ('Kolkata', 'West Bengal'),
    'garia': ('Kolkata', 'West Bengal'),
    'dum dum': ('Kolkata', 'West Bengal'),
    'behala': ('Kolkata', 'West Bengal'),
    'jadavpur': ('Kolkata', 'West Bengal'),
    
    # Pune
    'kothrud': ('Pune', 'Maharashtra'),
    'hinjewadi': ('Pune', 'Maharashtra'),
    'wakad': ('Pune', 'Maharashtra'),
    'baner': ('Pune', 'Maharashtra'),
    'aundh': ('Pune', 'Maharashtra'),
    'viman nagar': ('Pune', 'Maharashtra'),
    'hadapsar': ('Pune', 'Maharashtra'),
    'shivajinagar': ('Pune', 'Maharashtra'),
    'pimpri': ('Pune', 'Maharashtra'),
    'chinchwad': ('Pune', 'Maharashtra'),
    'bhosari': ('Pune', 'Maharashtra'),
    'magarpatta': ('Pune', 'Maharashtra'),
    'kalyani nagar': ('Pune', 'Maharashtra'),
    'kharadi': ('Pune', 'Maharashtra'),
    'warje': ('Pune', 'Maharashtra'),
    'katraj': ('Pune', 'Maharashtra'),

    # Bengaluru
    'hoskote': ('Bengaluru Rural', 'Karnataka'),
    'bommanahalli': ('Bengaluru', 'Karnataka'),
    'krishnanda nagar': ('Bengaluru', 'Karnataka'),
    'dasarahalli': ('Bengaluru', 'Karnataka'),
    'bbmp dasarahalli': ('Bengaluru', 'Karnataka'),
    'chokkanahalli': ('Bengaluru', 'Karnataka'),
    'jp nagar': ('Bengaluru', 'Karnataka'),
    'rajarajeshwari nagar': ('Bengaluru', 'Karnataka'),
    'machohalli': ('Bengaluru', 'Karnataka'),
    'bapagrama': ('Bengaluru', 'Karnataka'),
    'yelahanka': ('Bengaluru', 'Karnataka'),
    'jayanagar': ('Bengaluru', 'Karnataka'),
    'rajajinagar': ('Bengaluru', 'Karnataka'),
    'indiranagar': ('Bengaluru', 'Karnataka'),
    'koramangala': ('Bengaluru', 'Karnataka'),
    'whitefield': ('Bengaluru', 'Karnataka'),
    'electronic city': ('Bengaluru', 'Karnataka'),
    'marathahalli': ('Bengaluru', 'Karnataka'),
    'malleshwaram': ('Bengaluru', 'Karnataka'),
    'hebbal': ('Bengaluru', 'Karnataka'),
    'hsr layout': ('Bengaluru', 'Karnataka'),
    'btm layout': ('Bengaluru', 'Karnataka'),
    'banashankari': ('Bengaluru', 'Karnataka'),
    'basavanagudi': ('Bengaluru', 'Karnataka'),
    'yeshwanthpur': ('Bengaluru', 'Karnataka'),
    'nagasandra': ('Bengaluru', 'Karnataka'),
    'kengeri': ('Bengaluru', 'Karnataka'),
    'vijayanagar': ('Bengaluru', 'Karnataka'),
    'peenya': ('Bengaluru', 'Karnataka'),

    # Ahmedabad
    'navrangpura': ('Ahmedabad', 'Gujarat'),
    'satellite': ('Ahmedabad', 'Gujarat'),
    'vastrapur': ('Ahmedabad', 'Gujarat'),
    'bodakdev': ('Ahmedabad', 'Gujarat'),
    'maninagar': ('Ahmedabad', 'Gujarat'),
    'chandkheda': ('Ahmedabad', 'Gujarat'),
    'bopal': ('Ahmedabad', 'Gujarat'),
    'gandhinagar': ('Gandhinagar', 'Gujarat'),
    'ellisbridge': ('Ahmedabad', 'Gujarat'),

    # Jaipur
    'mansarovar': ('Jaipur', 'Rajasthan'),
    'malviya nagar': ('Jaipur', 'Rajasthan'),
    'vaishali nagar': ('Jaipur', 'Rajasthan'),
    'raja park': ('Jaipur', 'Rajasthan'),
    'c scheme': ('Jaipur', 'Rajasthan'),
    'sanganer': ('Jaipur', 'Rajasthan'),
    'jagatpura': ('Jaipur', 'Rajasthan'),

    # Lucknow
    'gomti nagar': ('Lucknow', 'Uttar Pradesh'),
    'alambagh': ('Lucknow', 'Uttar Pradesh'),
    'hazratganj': ('Lucknow', 'Uttar Pradesh'),
    'indira nagar': ('Lucknow', 'Uttar Pradesh'),
    'aliganj': ('Lucknow', 'Uttar Pradesh')
}

# Authoritative City to Tier mapping across India
CITY_TO_TIER = {
    # Metro 1
    'bengaluru': 'Metro 1',
    'bangalore': 'Metro 1',
    'mumbai': 'Metro 1',
    'navi mumbai': 'Metro 1',
    'thane': 'Metro 1',
    'delhi': 'Metro 1',
    'new delhi': 'Metro 1',
    'noida': 'Metro 1',
    'greater noida': 'Metro 1',
    'gurgaon': 'Metro 1',
    'gurugram': 'Metro 1',
    'faridabad': 'Metro 1',
    'ghaziabad': 'Metro 1',
    'hyderabad': 'Metro 1',
    'secunderabad': 'Metro 1',
    'chennai': 'Metro 1',
    'kolkata': 'Metro 1',
    'howrah': 'Metro 1',

    # Metro 2
    'pune': 'Metro 2',
    'ahmedabad': 'Metro 2',
    'gandhinagar': 'Metro 2',

    # Large City 1
    'jaipur': 'Large City 1',
    'surat': 'Large City 1',
    'lucknow': 'Large City 1',
    'kanpur': 'Large City 1',
    'nagpur': 'Large City 1',
    'indore': 'Large City 1',
    'bhopal': 'Large City 1',
    'patna': 'Large City 1',
    'vadodara': 'Large City 1',
    'coimbatore': 'Large City 1',

    # Large City 2
    'visakhapatnam': 'Large City 2',
    'vizag': 'Large City 2',
    'agra': 'Large City 2',
    'varanasi': 'Large City 2',
    'ludhiana': 'Large City 2',
    'nashik': 'Large City 2',
    'rajkot': 'Large City 2',
    'madurai': 'Large City 2',
    'meerut': 'Large City 2',
    'jabalpur': 'Large City 2',
    'gwalior': 'Large City 2',
    'chandigarh': 'Large City 2',
    'mohali': 'Large City 2',
    'panchkula': 'Large City 2',

    # City 1
    'amritsar': 'City 1',
    'allahabad': 'City 1',
    'prayagraj': 'City 1',
    'ranchi': 'City 1',
    'jodhpur': 'City 1',
    'raipur': 'City 1',
    'kota': 'City 1',
    'guwahati': 'City 1',
    'mysore': 'City 1',
    'mysuru': 'City 1',
    'hubli': 'City 1',
    'hubballi': 'City 1',
    'mangalore': 'City 1',
    'mangaluru': 'City 1',
    'belgaum': 'City 1',
    'belagavi': 'City 1',
    'salem': 'City 1',
    'tiruchirappalli': 'City 1',
    'trichy': 'City 1',
    'bareilly': 'City 1',
    'aligarh': 'City 1',
    'moradabad': 'City 1',
    'jalandhar': 'City 1',
    'bhubaneswar': 'City 1',
    'warangal': 'City 1',
    'guntur': 'City 1',
    'vijayawada': 'City 1',
    'tirupati': 'City 1',
    'dehradun': 'City 1',
    'kochi': 'City 1',
    'cochin': 'City 1',
    'thiruvananthapuram': 'City 1',
    'trivandrum': 'City 1',
    'calicut': 'City 1',
    'kozhikode': 'City 1',
    'gorakhpur': 'City 1',
    'saharanpur': 'City 1',
    'firozabad': 'City 1',
    'jhansi': 'City 1',
    'muzaffarnagar': 'City 1',
    'mathura': 'City 1',
    'kollam': 'City 1',
    'thrissur': 'City 1',
    'kannur': 'City 1',
    'dhanbad': 'City 1',
    'jamshedpur': 'City 1',
    'bokaro': 'City 1',
    'udaipur': 'City 1',
    'ajmer': 'City 1',
    'bikaner': 'City 1',
    'amravati': 'City 1',
    'solapur': 'City 1',
    'kolhapur': 'City 1',
    'aurangabad': 'City 1',
    'kurnool': 'City 1',
    'nellore': 'City 1',
    'rajahmundry': 'City 1',
    'kakinada': 'City 1',
    'karimnagar': 'City 1',
    'nizamabad': 'City 1',
    'tirunelveli': 'City 1',
    'erode': 'City 1',
    'vellore': 'City 1',
    'tuticorin': 'City 1',
    'thoothukudi': 'City 1',
    'siliguri': 'City 1',
    'rourkela': 'City 1',
    'haridwar': 'City 1',
    'roorkee': 'City 1',
    'haldwani': 'City 1',
    'jammu': 'City 1',
    'srinagar': 'City 1'
}

def extract_city_from_address(addr: str) -> str:
    if not addr:
        return ""
    clean_addr = re.sub(r',\s*india\.?', '', addr.strip(), flags=re.I)
    parts = [p.strip() for p in clean_addr.split(',') if p.strip()]
    meaningful = [p for p in parts if not re.match(r'^\d{6}$', p) and not re.match(r'^pin(?:\s*code)?\s*[-:]?\s*\d+$', p, re.I)]
    if not meaningful:
        return ""

    city_keys = sorted(CITY_TO_TIER.keys(), key=len, reverse=True)

    # 1. Look backwards for state token, and examine previous component
    for i in range(len(meaningful) - 1, -1, -1):
        clean_part = re.sub(r'[\d\-_/]+', ' ', meaningful[i]).strip().lower()
        if clean_part in {s.lower() for s in INDIAN_STATES}:
            if i > 0:
                prev = re.sub(r'[\d\-_/]+', ' ', meaningful[i - 1]).strip().lower()
                for c in city_keys:
                    if re.search(rf'\b{c}\b', prev):
                        return c
                return prev
        # Check if segment contains state name attached (e.g. "Chennai Tamil Nadu")
        for st in sorted(INDIAN_STATES, key=len, reverse=True):
            st_l = st.lower()
            if clean_part.endswith(st_l) and len(clean_part) > len(st_l):
                sub = clean_part[:-len(st_l)].strip()
                for c in city_keys:
                    if re.search(rf'\b{c}\b', sub):
                        return c
                return sub

    # 2. Check the trailing components for any known city
    last_two = ' '.join(meaningful[-2:]).lower()
    last_two = re.sub(r'[\d\-_/]+', ' ', last_two)
    for c in city_keys:
        if re.search(rf'\b{c}\b', last_two):
            return c

    return ""

def is_garbage_record(r: dict, all_rows_by_name: dict) -> tuple[bool, str]:
    addr = r['address'].strip()
    name = r['hospital_name'].strip()
    rating = r['rating'].strip()
    
    if not addr:
        return True, "Empty address"
        
    # State truncation fragment e.g. "Pradesh ,522004", "Bengal ,700001", "Nadu ,600001"
    if re.match(r'^(pradesh|bengal|kashmir|nadu)\s*,\s*\d+$', addr, re.I):
        return True, f"Truncated state fragment: {addr}"
        
    # Only pincode e.g. ",431122" or "431122"
    if re.match(r'^[,\s]*\d{6}[,\s]*$', addr):
        return True, f"Pincode only: {addr}"
        
    # Fragment without letters or only tiny codes: "B-3, Andhra Pradesh", "11-50, Andhra Pradesh", "1/334, Andhra Pradesh"
    no_state = re.sub(
        r'\b(andhra pradesh|karnataka|tamil nadu|maharashtra|delhi|gujarat|rajasthan|uttar pradesh|west bengal|kerala|punjab|haryana|madhya pradesh|bihar|odisha|jharkhand|assam|chhattisgarh|jammu and kashmir|jammu & kashmir)\b',
        '', addr, flags=re.I
    )
    alpha_chars = re.sub(r'[^a-zA-Z]', '', no_state)
    if len(alpha_chars) <= 2:
        return True, f"No street or city: {addr}"
        
    # Bogus short mismatched entries with 0 rating like "SAGAR HOSPITALS, BANGALORE, Andhra Pradesh"
    if re.match(r'^(bangalore|bengaluru|chennai|hyderabad)\s*,\s*andhra pradesh$', addr, re.I) and rating == '0.0':
        norm_name = name.lower()
        if len(all_rows_by_name.get(norm_name, [])) > 1:
            return True, f"Bogus zero-rated mismatch duplicate: {addr}"
        
    return False, ""

def enrich_stub_address(name: str, addr: str) -> str:
    addr_clean = addr.strip()
    words = [w for w in re.sub(r'[\s,.\-:/()]+', ' ', addr_clean).split() if len(w) > 1]
    if len(words) <= 3 and not re.search(r'\d', addr_clean):
        clean_n = re.sub(r'^(chc|phc|c\s*h\s*c|p\s*h\s*c|district\s+hospital|sub\s+district\s+hospital)\s*[-:]?\s*', '', name, flags=re.I).strip()
        clean_n = re.sub(r'\s+(hospital|centre|center|male|female|district|rural|urban).*$', '', clean_n, flags=re.I).strip()
        if len(clean_n) >= 3 and clean_n.lower() not in addr_clean.lower():
            return f"{clean_n.title()}, {addr_clean}"
    return addr_clean

def clean_address(addr: str, hosp_name: str) -> str:
    if not addr:
        return ""
    
    # Enrich stub if needed
    addr = enrich_stub_address(hosp_name, addr)
    
    # 1. Handle wide space splices (\s{3,})
    if re.search(r'\s{3,}', addr):
        parts = re.split(r'\s{3,}', addr)
        left = parts[0].strip()
        right = parts[-1].strip()
        
        m_left_complete = re.search(r',?\s*([A-Za-z\s]+),\s*([A-Za-z\s&]+)\s*,?\s*(\d{6})$', left)
        if m_left_complete:
            addr = left
        else:
            m_left_pin = re.search(r'\b(\d{6})$', left)
            if m_left_pin and any(s.lower() in left.lower() for s in INDIAN_STATES):
                addr = left
            else:
                m_end = re.search(r',?\s*([A-Za-z\s]+),\s*([A-Za-z\s&]+)\s*,?\s*(\d{6})?$', right)
                if m_end:
                    end_city = m_end.group(1).strip()
                    end_state = m_end.group(2).strip()
                    end_pin = m_end.group(3) or ''
                    
                    if end_state.lower() == 'nadu' and 'tamil' in left.lower():
                        left = re.sub(r',?\s*tamil\b', '', left, flags=re.I).strip()
                        end_state = 'Tamil Nadu'
                    elif end_state.lower() == 'bengal' and 'west' in left.lower():
                        left = re.sub(r',?\s*west\b', '', left, flags=re.I).strip()
                        end_state = 'West Bengal'
                    elif end_state.lower() == 'pradesh':
                        for p in ['Andhra', 'Madhya', 'Uttar', 'Himachal']:
                            if p.lower() in left.lower():
                                left = re.sub(rf',?\s*{p}\b', '', left, flags=re.I).strip()
                                end_state = f"{p} Pradesh"
                                break
                    
                    left_clean = re.sub(r'\(?\s*city(\s*-\s*.*)?$', '', left, flags=re.I).strip()
                    left_clean = re.sub(r'[\s,.\-:/()]+$', '', left_clean).strip()
                    
                    norm_city_key = end_city.lower()
                    if norm_city_key in CITY_TO_STATE:
                        canon_city, canon_state = CITY_TO_STATE[norm_city_key]
                        end_city = canon_city
                        end_state = canon_state
                    
                    tail = f"{end_city}, {end_state}" + (f", {end_pin}" if end_pin else "")
                    if left_clean and left_clean.lower() != end_city.lower():
                        addr = f"{left_clean}, {tail}"
                    else:
                        addr = tail
                else:
                    addr = left

    # 2. Strip OCR tags like "(City - ...)", "( City - ... )", "( City"
    addr = re.sub(r'\(?\s*city\s*-\s*[^)]+\)?', '', addr, flags=re.I)
    addr = re.sub(r'\(?\s*city\s*\)?', '', addr, flags=re.I)
    
    # 3. Handle locality and sub-city patterns for ALL METRO CITIES
    lower_addr = addr.lower()
    for loc, (canon_city, canon_state) in METRO_LOCALITIES.items():
        if re.search(r'\b' + re.escape(loc) + r'\b', lower_addr):
            for main_city in ['mumbai', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'bangalore', 'bengaluru']:
                if re.search(rf'\b{main_city}[,\s]+{loc}\b', addr, re.I):
                    addr = re.sub(rf'\b{main_city}[,\s]+{loc}\b', f"{loc.title()}, {canon_city}", addr, flags=re.I)
                elif re.search(rf'\b{loc}[,\s]+{main_city}\b', addr, re.I):
                    addr = re.sub(rf'\b{loc}[,\s]+{main_city}\b', f"{loc.title()}, {canon_city}", addr, flags=re.I)

    # 4. Correct City-State based strictly on the city position at the end of the address
    m_city_pos = re.search(r',?\s*([A-Za-z\s]+),\s*([A-Za-z\s&]+)\s*(?:,\s*(\d{6}))?$', addr)
    if m_city_pos:
        city_token = m_city_pos.group(1).strip()
        state_token = m_city_pos.group(2).strip()
        pin_token = m_city_pos.group(3) or ''
        
        city_key = city_token.lower()
        if city_key in CITY_TO_STATE:
            canon_city, canon_state = CITY_TO_STATE[city_key]
            pin_part = f", {pin_token}" if pin_token else ""
            prefix = addr[:m_city_pos.start()].rstrip(', ')
            if prefix:
                addr = f"{prefix}, {canon_city}, {canon_state}{pin_part}"
            else:
                addr = f"{canon_city}, {canon_state}{pin_part}"
        elif city_token.lower() in METRO_LOCALITIES:
            canon_city, canon_state = METRO_LOCALITIES[city_token.lower()]
            pin_part = f", {pin_token}" if pin_token else ""
            prefix = addr[:m_city_pos.start()].rstrip(', ')
            if prefix:
                addr = f"{prefix}, {city_token.title()}, {canon_city}, {canon_state}{pin_part}"
            else:
                addr = f"{city_token.title()}, {canon_city}, {canon_state}{pin_part}"
        elif city_token.upper() in ['BANGALORE', 'BENGALURU'] and state_token.lower() == 'andhra pradesh':
            pin_part = f", {pin_token}" if pin_token else ""
            addr = f"Bengaluru, Karnataka{pin_part}"
        elif city_token.upper() == 'CHENNAI' and state_token.lower() == 'andhra pradesh':
            pin_part = f", {pin_token}" if pin_token else ""
            addr = f"Chennai, Tamil Nadu{pin_part}"
        elif city_token.upper() in ['HYDERABAD', 'SECUNDERABAD'] and state_token.lower() == 'andhra pradesh':
            pin_part = f", {pin_token}" if pin_token else ""
            addr = f"Hyderabad, Telangana{pin_part}"
                    
    # 5. Clean punctuation, spacing, and redundant commas
    addr = re.sub(r'""', '', addr)
    addr = re.sub(r'\s*,\s*', ', ', addr)
    addr = re.sub(r',(\s*,)+', ',', addr)
    addr = re.sub(r'\s{2,}', ' ', addr)
    addr = re.sub(r'^[\s,.\-:/()]+|[\s,.\-:/()]+$', '', addr).strip()
    
    return addr

def run_cleaning():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.abspath(os.path.join(base_dir, '..'))
    
    backup_csv = os.path.join(workspace_dir, 'hospitals.csv.bak')
    primary_csv = os.path.join(workspace_dir, 'hospitals.csv')
    cost_csv1 = os.path.join(workspace_dir, 'cost', 'hospitals.csv')
    cost_csv2 = os.path.join(workspace_dir, 'cost', 'data', 'hospitals.csv')
    
    source_file = backup_csv if os.path.exists(backup_csv) else primary_csv
    print(f"Reading source dataset: {source_file}")
    with open(source_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
        
    total_original = len(rows)
    print(f"Total input rows: {total_original}")
    
    # Build name lookup for duplicate check
    all_rows_by_name = {}
    for r in rows:
        n = r['hospital_name'].strip().lower()
        if n not in all_rows_by_name:
            all_rows_by_name[n] = []
        all_rows_by_name[n].append(r)
        
    removals = []
    modifications = []
    valid_cleaned_rows = []
    
    # Pass 1: Remove garbage and clean addresses
    for idx, r in enumerate(rows):
        is_garb, reason = is_garbage_record(r, all_rows_by_name)
        if is_garb:
            removals.append({
                'row_index': idx,
                'hospital_name': r['hospital_name'],
                'address': r['address'],
                'reason': reason
            })
            continue
            
        orig_addr = r['address']
        new_addr = clean_address(orig_addr, r['hospital_name'])
        
        if new_addr != orig_addr:
            modifications.append({
                'row_index': idx,
                'hospital_name': r['hospital_name'],
                'before': orig_addr,
                'after': new_addr
            })
            r['address'] = new_addr
            
        valid_cleaned_rows.append(r)
        
    # Pass 2: Deduplicate exact duplicate addresses across all cities
    addr_groups = {}
    for r in valid_cleaned_rows:
        norm_a = r['address'].strip().lower()
        if norm_a not in addr_groups:
            addr_groups[norm_a] = []
        addr_groups[norm_a].append(r)

    deduped_records = []
    duplicate_addresses_removed = 0

    for norm_a, group in addr_groups.items():
        if len(group) == 1:
            deduped_records.append(group[0])
        else:
            duplicate_addresses_removed += len(group) - 1
            all_insurers = []
            for g in group:
                for ins in (g['insurers'] or '').split(','):
                    ins_s = ins.strip()
                    if ins_s and ins_s not in all_insurers:
                        all_insurers.append(ins_s)
            
            ratings = []
            for g in group:
                try:
                    ratings.append(float(g['rating']))
                except ValueError:
                    pass
            best_rating = max(ratings) if ratings else 0.0
            
            names = [g['hospital_name'] for g in group]
            best_name = max(names, key=len)
            
            specs = [g['specialties'] for g in group]
            best_spec = max(specs, key=len)
            
            primary = group[0].copy()
            primary['hospital_name'] = best_name
            primary['rating'] = str(best_rating)
            primary['insurers'] = ','.join(all_insurers) if all_insurers else 'PMJAY'
            primary['specialties'] = best_spec
            
            deduped_records.append(primary)

    # Pass 3: Correct Tier based on canonical city of the address
    final_clean_records = []
    tiers_corrected = 0
    tier_corrections_by_city = Counter()

    for r in deduped_records:
        city_token = extract_city_from_address(r['address'])
        if city_token in CITY_TO_TIER:
            canonical_tier = CITY_TO_TIER[city_token]
            if canonical_tier != r['tier']:
                tiers_corrected += 1
                tier_corrections_by_city[city_token] += 1
                r['tier'] = canonical_tier
        final_clean_records.append(r)

    total_removed = len(removals) + duplicate_addresses_removed
    total_clean = len(final_clean_records)
    total_modified = len(modifications)
    
    print("=" * 65)
    print("CLEANING, DEDUPLICATION & TIER CORRECTION AUDIT RESULTS:")
    print(f"  Total Original Records:             {total_original}")
    print(f"  Corrupted / Garbage Rows Removed:   {len(removals)}")
    print(f"  Duplicate Address Rows Removed:     {duplicate_addresses_removed}")
    print(f"  Total Rows Removed:                 {total_removed}")
    print(f"  Total Addresses Modified & Cleaned: {total_modified}")
    print(f"  Total Hospital Tiers Corrected:     {tiers_corrected}")
    print(f"  Final Unique Clean Hospital Records:{total_clean}")
    print("=" * 65)
    
    print("Top Cities with Corrected Tiers:")
    for c, cnt in tier_corrections_by_city.most_common(15):
        print(f"  {c.title():15}: {cnt} hospital tiers corrected to {CITY_TO_TIER[c]}")
    print("=" * 65)
    
    # City counts in final clean dataset
    city_counter = Counter()
    for r in final_clean_records:
        addr_l = r['address'].lower()
        for c in ['mumbai', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'pune', 'bengaluru', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'surat', 'nagpur', 'patna', 'bhopal', 'indore', 'vadodara', 'visakhapatnam', 'kanpur', 'agra']:
            if c in addr_l:
                city_counter[c] += 1
                break
                
    print("Clean Metro & Major City Hospital Counts:")
    for c, cnt in city_counter.most_common():
        print(f"  {c.title():15}: {cnt} hospitals")
    print("=" * 65)
    
    # Write to target files
    targets = [primary_csv, cost_csv1, cost_csv2]
    for target_path in targets:
        if os.path.exists(os.path.dirname(target_path)):
            print(f"Writing {total_clean} cleaned & deduped records to: {target_path}")
            with open(target_path, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(final_clean_records)
                
    # Save audit report json
    report_path = os.path.join(base_dir, 'cleaning_report.json')
    report_data = {
        'total_original': total_original,
        'garbage_removed': len(removals),
        'duplicate_addresses_removed': duplicate_addresses_removed,
        'total_removed': total_removed,
        'total_modified': total_modified,
        'tiers_corrected': tiers_corrected,
        'final_clean_records': total_clean,
        'top_tier_corrections': dict(tier_corrections_by_city.most_common(20)),
        'metro_city_counts': dict(city_counter.most_common())
    }
    with open(report_path, mode='w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2)
    print(f"Detailed audit report saved to: {report_path}")

if __name__ == '__main__':
    run_cleaning()
