import json

with open(r'C:\Users\LENOVO\.gemini\antigravity\brain\bc467a92-886b-45c3-9142-7448fc704792\.system_generated\logs\overview.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for line in lines:
        if "use this api key bro" in line:
            data = json.loads(line)
            print(data['content'])
