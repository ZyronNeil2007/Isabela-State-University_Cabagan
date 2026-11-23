import csv
import random
from datetime import datetime, timedelta

# Constants based on typical ISU student data
FIRST_NAMES = [
    "Juan", "Maria", "Jose", "Ana", "Miguel", "Isabella", "Carlos", "Sofia",
    "Luis", "Carmen", "Pedro", "Elena", "Antonio", "Lucia", "Francisco"
]
LAST_NAMES = [
    "Dela Cruz", "Reyes", "Santos", "Bautista", "Ocampo", "Garcia", "Mendoza",
    "Cruz", "Aquino", "Navarro", "Villanueva", "Ramos", "Fernandez", "Domingo"
]
DEPARTMENTS = ["CBM", "CCJE", "CAST", "CCSICT", "COE", "CED", "CFEM", "CCSS", "CS"]
ADDRESSES = [
    "Brgy. San Antonio, Cauayan City, Isabela",
    "Alibagu, Ilagan City, Isabela",
    "Minante I, Cauayan City, Isabela",
    "Cabaruan, Cauayan City, Isabela",
    "Roxas, Isabela",
    "Tumauini, Isabela",
    "San Mateo, Isabela",
    "Alicia, Isabela"
]

def generate_random_dob():
    # Generate a random birthdate for someone 18-24 years old
    start_date = datetime(2000, 1, 1)
    end_date = datetime(2006, 12, 31)
    days_between = (end_date - start_date).days
    random_days = random.randrange(days_between)
    return (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")

def generate_dummy_students(filename="dummy_students.csv", num_students=50):
    print(f"Generating {num_students} dummy student records...")
    
    headers = [
        "Name", "ID Number", "Course", "Date of Birth", 
        "Parent Name", "Address", "Telephone"
    ]
    
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(headers)
        
        for i in range(1, num_students + 1):
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            id_number = f"26-{str(i).zfill(5)}"
            course = random.choice(DEPARTMENTS) # Web app CSV parses 'course' to match 'department' index
            dob = generate_random_dob()
            parent_name = f"{random.choice(FIRST_NAMES)} {name.split(' ')[-1]}"
            address = random.choice(ADDRESSES)
            telephone = f"09{random.randint(100000000, 999999999)}"
            
            writer.writerow([name, id_number, course, dob, parent_name, address, telephone])
            
    print(f"Successfully created {filename}!")
    print("You can now go to the web app, click the 'CSV Import' button (the file icon next to the '+' button), and upload this file to batch generate IDs.")

if __name__ == "__main__":
    generate_dummy_students()
