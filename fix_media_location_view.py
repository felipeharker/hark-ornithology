with open('web/src/components/LocationDashboard.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "Media from Location" in line:
        start_idx = i
        break

if start_idx != -1:
    # Need to find the end of the div.
    # It ends before "Species Total Table"
    for i in range(start_idx, len(lines)):
        if "Species Total Table" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + lines[end_idx:]
    with open('web/src/components/LocationDashboard.tsx', 'w') as f:
        f.writelines(new_lines)
