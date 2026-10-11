"""
Beyond Barriers - Comprehensive Seed Dataset
Provides realistic mock data for 4 roles, unified student profiles,
adaptive modules, tests with confidence tracking, attendance, marks,
scholarships, resources, and career roadmaps.
"""

STUDENTS = [
    {
        "id": 1,
        "name": "Aarav Sharma",
        "roll_number": 14,
        "roll_code": "CS-014",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "visual",
        "internet_access": "intermittent",
        "device_access": "shared_smartphone",
        "income_category": "<1.5L",
        "career_interest": "Artificial Intelligence",
        "preferred_response_format": "audio",
        "preferred_language": "en"
    },
    {
        "id": 2,
        "name": "Priya Verma",
        "roll_number": 5,
        "roll_code": "CS-005",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": "<3L",
        "career_interest": "Web Development",
        "preferred_response_format": "visual",
        "preferred_language": "en"
    },
    {
        "id": 3,
        "name": "Kabir Roy",
        "roll_number": 19,
        "roll_code": "CS-019",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "hearing",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": "<8L",
        "career_interest": "Data Science",
        "preferred_response_format": "text",
        "preferred_language": "en"
    },
    {
        "id": 4,
        "name": "Sneha Patel",
        "roll_number": 8,
        "roll_code": "CS-008",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "intermittent",
        "device_access": "shared_smartphone",
        "income_category": "<1.5L",
        "career_interest": "Cybersecurity",
        "preferred_response_format": "visual",
        "preferred_language": "hi"
    },
    {
        "id": 5,
        "name": "Rohan Deshmukh",
        "roll_number": 22,
        "roll_code": "CS-022",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "none",
        "device_access": "none",
        "income_category": "<1.5L",
        "career_interest": "Web Development",
        "preferred_response_format": "text",
        "preferred_language": "hi"
    },
    {
        "id": 6,
        "name": "Ananya Iyer",
        "roll_number": 27,
        "roll_code": "CS-027",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "speech",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": "<3L",
        "career_interest": "Artificial Intelligence",
        "preferred_response_format": "text",
        "preferred_language": "en"
    },
    {
        "id": 7,
        "name": "Vikram Singh",
        "roll_number": 31,
        "roll_code": "CS-031",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": ">8L",
        "career_interest": "Data Science",
        "preferred_response_format": "visual",
        "preferred_language": "en"
    },
    {
        "id": 8,
        "name": "Meera Nair",
        "roll_number": 11,
        "roll_code": "CS-011",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "visual",
        "internet_access": "intermittent",
        "device_access": "shared_smartphone",
        "income_category": "<3L",
        "career_interest": "Artificial Intelligence",
        "preferred_response_format": "audio",
        "preferred_language": "en"
    },
    {
        "id": 9,
        "name": "Farhan Ali",
        "roll_number": 25,
        "roll_code": "CS-025",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": "<1.5L",
        "career_interest": "Cybersecurity",
        "preferred_response_format": "visual",
        "preferred_language": "en"
    },
    {
        "id": 10,
        "name": "Diya Sengupta",
        "roll_number": 35,
        "roll_code": "CS-035",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": "<3L",
        "career_interest": "Web Development",
        "preferred_response_format": "visual",
        "preferred_language": "en"
    },
    {
        "id": 11,
        "name": "Kavya Patel",
        "roll_number": 38,
        "roll_code": "CS-038",
        "class": "Class 10",
        "stream": "General",
        "disability_type": "none",
        "internet_access": "intermittent",
        "device_access": "shared_smartphone",
        "income_category": "<3L",
        "career_interest": "Other / Explore",
        "preferred_response_format": "text",
        "preferred_language": "en",
        "is_profile_completed": 0
    }
]

MENTORS = [
    {
        "id": 1,
        "name": "Dr. Radhika Sen",
        "email": "radhika.sen@school.edu",
        "department": "Department of Science & Mentorship",
        "assigned_roll_start": 1,
        "assigned_roll_end": 20
    },
    {
        "id": 2,
        "name": "Prof. Vikram Joshi",
        "email": "vikram.joshi@school.edu",
        "department": "Academic Support & Counseling",
        "assigned_roll_start": 21,
        "assigned_roll_end": 40
    }
]

PARENTS = [
    {
        "id": 1,
        "name": "Sunita Sharma",
        "email": "sunita.sharma@parent.org",
        "linked_student_id": 1, # Aarav Sharma (Roll 14)
        "relationship": "Mother"
    },
    {
        "id": 2,
        "name": "Rajesh Verma",
        "email": "rajesh.verma@parent.org",
        "linked_student_id": 2, # Priya Verma (Roll 5)
        "relationship": "Father"
    },
    {
        "id": 3,
        "name": "Anita Roy",
        "email": "anita.roy@parent.org",
        "linked_student_id": 3, # Kabir Roy (Roll 19)
        "relationship": "Mother"
    },
    {
        "id": 4,
        "name": "Gopal Deshmukh",
        "email": "gopal.deshmukh@parent.org",
        "linked_student_id": 5, # Rohan Deshmukh (Roll 22)
        "relationship": "Father"
    }
]

ADMINISTRATORS = [
    {
        "id": 1,
        "name": "P. K. Verma",
        "email": "admin.aid@portal.gov",
        "title": "Scholarship & Aid Director"
    }
]

SUBJECTS = [
    {
        "id": 1,
        "name": "Mathematics",
        "code": "MATH-10",
        "class": "Class 10",
        "stream": "General",
        "description": "Standard Class 10 CBSE/NCERT curriculum covering Number Systems, Algebra, and Geometry."
    },
    {
        "id": 2,
        "name": "Science",
        "code": "SCI-10",
        "class": "Class 10",
        "stream": "General",
        "description": "Integrated Physics, Chemistry, and Biology fundamentals for Class 10."
    },
    {
        "id": 3,
        "name": "Social Science",
        "code": "SOC-10",
        "class": "Class 10",
        "stream": "General",
        "description": "History, Geography, Democratic Politics, and Economics."
    },
    {
        "id": 4,
        "name": "English",
        "code": "ENG-10",
        "class": "Class 10",
        "stream": "General",
        "description": "Language, reading comprehension, and communicative literature."
    },
    {
        "id": 5,
        "name": "Physics",
        "code": "PHY-12",
        "class": "Class 12",
        "stream": "Science",
        "description": "Mechanics, Electrodynamics, Optics, and Modern Physics."
    },
    {
        "id": 6,
        "name": "Chemistry",
        "code": "CHEM-12",
        "class": "Class 12",
        "stream": "Science",
        "description": "Physical, Inorganic, and Organic Chemistry for Class 12."
    },
    {
        "id": 7,
        "name": "Mathematics",
        "code": "MATH-12",
        "class": "Class 12",
        "stream": "Science",
        "description": "Calculus, Vectors, Probability, and Three-Dimensional Geometry."
    },
    {
        "id": 8,
        "name": "Computer Science",
        "code": "CS-12",
        "class": "Class 12",
        "stream": "Science",
        "description": "Python, Data Structures, SQL, and Computer Networks."
    },
    {
        "id": 9,
        "name": "Accountancy",
        "code": "ACC-12",
        "class": "Class 12",
        "stream": "Commerce",
        "description": "Accounting for Partnership Firms, Companies, and Financial Statement Analysis."
    },
    {
        "id": 10,
        "name": "Business Studies",
        "code": "BST-12",
        "class": "Class 12",
        "stream": "Commerce",
        "description": "Principles and Functions of Management, Financial Markets, and Marketing."
    },
    {
        "id": 11,
        "name": "Economics",
        "code": "ECO-12",
        "class": "Class 12",
        "stream": "Commerce",
        "description": "Introductory Macroeconomics and Indian Economic Development."
    },
    {
        "id": 12,
        "name": "History",
        "code": "HIST-12",
        "class": "Class 12",
        "stream": "Arts",
        "description": "Themes in Indian History: Ancient, Medieval, and Modern."
    },
    {
        "id": 13,
        "name": "Political Science",
        "code": "POL-12",
        "class": "Class 12",
        "stream": "Arts",
        "description": "Contemporary World Politics and Politics in India since Independence."
    }
]

MODULES = [
    # Subject 1: Class 10 Mathematics
    {
        "id": 1,
        "subject_id": 1,
        "module_number": 1,
        "title": "Real Numbers & Fundamental Theorem of Arithmetic",
        "summary_content": "Key takeaways: Every composite number can be factored uniquely as a product of primes. HCF(a, b) * LCM(a, b) = a * b. Rational numbers terminate if prime factors of denominator are only 2 and 5.",
        "detailed_content": "Comprehensive Study Guide:\n1. Fundamental Theorem of Arithmetic: Every composite number can be uniquely factored into primes, apart from the order of factors.\n2. HCF & LCM Property: For any two positive integers a and b, HCF(a, b) * LCM(a, b) = a * b. Example: For 12 and 18, 12 = 2^2 * 3, 18 = 2 * 3^2. HCF = 6, LCM = 36. 6 * 36 = 216 = 12 * 18.\n3. Decimal Expansions: p/q terminates if and only if denominator q = 2^n * 5^m.\n4. Practice Problem: Why can 6^n never end in 0? Because ending in 0 requires prime factor 5, which 6 = 2 * 3 lacks.",
        "difficulty_level": "standard"
    },
    {
        "id": 2,
        "subject_id": 1,
        "module_number": 2,
        "title": "Polynomials & Quadratic Relations",
        "summary_content": "Key takeaways: Zeroes of polynomial P(x) are x-coordinates where graph touches the x-axis. For quadratic ax^2 + bx + c: Sum of roots = -b/a, Product of roots = c/a.",
        "detailed_content": "Comprehensive Study Guide:\n1. Geometrical Meaning: A quadratic polynomial y = ax^2 + bx + c represents a parabola that intersects the x-axis at at most 2 points.\n2. Coefficients & Zeroes: If alpha and beta are roots, then alpha + beta = -b/a and alpha * beta = c/a.\n3. Step-by-Step Example: Factor x^2 + 7x + 10 = (x + 2)(x + 5). Roots are -2 and -5. Sum = -7 = -7/1. Product = 10 = 10/1.\n4. Cubic Relations: For ax^3 + bx^2 + cx + d, sum of roots = -b/a, pairwise sum = c/a, product = -d/a.",
        "difficulty_level": "standard"
    },
    {
        "id": 5,
        "subject_id": 1,
        "module_number": 3,
        "title": "Pair of Linear Equations in Two Variables",
        "summary_content": "Key takeaways: For lines a1*x + b1*y + c1 = 0 and a2*x + b2*y + c2 = 0: a1/a2 != b1/b2 means unique solution (intersecting lines); a1/a2 = b1/b2 = c1/c2 means infinite solutions (coincident); a1/a2 = b1/b2 != c1/c2 means no solution (parallel).",
        "detailed_content": "Comprehensive Study Guide:\n1. Consistency Conditions: A system is consistent if it has at least one solution. Intersecting lines have 1 unique solution. Coincident lines have infinitely many dependent solutions. Parallel lines have 0 solutions (inconsistent).\n2. Algebraic Methods: Substitution method, Elimination method, and Cross-multiplication.\n3. Worked Example: Solve 2x + 3y = 11 and 2x - 4y = -24. Subtracting gives 7y = 35 => y = 5. Substituting gives 2x + 15 = 11 => 2x = -4 => x = -2.",
        "difficulty_level": "standard"
    },
    {
        "id": 6,
        "subject_id": 1,
        "module_number": 4,
        "title": "Mathematics Final Course Assessment",
        "summary_content": "Comprehensive Capstone: Synthesizes Real Numbers, Polynomials, and Linear Equations into an integrated assessment.",
        "detailed_content": "Final Assessment Overview:\nThis comprehensive test validates your end-to-end mastery across all Class 10 Mathematics modules. It evaluates problem-solving fluency, conceptual understanding, and diagnostic precision.",
        "difficulty_level": "advanced"
    },

    # Subject 2: Class 10 Science
    {
        "id": 3,
        "subject_id": 2,
        "module_number": 1,
        "title": "Chemical Reactions & Equations",
        "summary_content": "Key takeaways: Conservation of mass requires balancing. Reaction types: Combination, Decomposition, Displacement, Double Displacement, Redox (Oxidation = loss of electrons, Reduction = gain).",
        "detailed_content": "Comprehensive Study Guide:\n1. Balancing Equations: 3Fe + 4H2O -> Fe3O4 + 4H2. Total mass of reactants equals total mass of products.\n2. Types of Reactions:\n- Combination: Quicklime + water CaO + H2O -> Ca(OH)2 (exothermic).\n- Decomposition: 2FeSO4 -> Fe2O3 + SO2 + SO3 (endothermic, requires heat).\n- Displacement: Fe + CuSO4 -> FeSO4 + Cu (iron displaces copper due to higher reactivity).\n3. Corrosion & Rancidity: Oxidation of metals in moist air; antioxidant preservation for food fats.",
        "difficulty_level": "standard"
    },
    {
        "id": 4,
        "subject_id": 2,
        "module_number": 2,
        "title": "Life Processes: Nutrition & Cellular Respiration",
        "summary_content": "Key takeaways: Autotrophic nutrition produces glucose via photosynthesis. Aerobic respiration produces 38 ATP; anaerobic produces lactic acid in muscle cells or ethanol in yeast.",
        "detailed_content": "Comprehensive Study Guide:\n1. Photosynthesis: 6CO2 + 6H2O -> C6H12O6 + 6O2 in chloroplasts using chlorophyll and sunlight.\n2. Human Digestion: Salivary amylase (mouth) -> Pepsin + HCl (stomach) -> Bile + Trypsin + Lipase (duodenum) -> Villi nutrient absorption.\n3. Respiration Breakdown: 6-carbon glucose is cleaved into 3-carbon pyruvate in cytoplasm. Aerobic oxidation in mitochondria produces CO2 + H2O + 38 ATP.",
        "difficulty_level": "standard"
    },
    {
        "id": 7,
        "subject_id": 2,
        "module_number": 3,
        "title": "Acids, Bases & Salts: pH & Neutralization",
        "summary_content": "Key takeaways: Acids yield H+ ions (pH < 7); Bases yield OH- ions (pH > 7). Acid + Base -> Salt + Water (Neutralization). Universal indicator measures hydronium concentration.",
        "detailed_content": "Comprehensive Study Guide:\n1. Definitions: Arrhenius acids generate H+(aq) ions; bases generate OH-(aq) ions. Litmus turns red in acid, blue in base.\n2. The pH Scale: pH = -log[H+]. pH 7 is neutral. pH < 7 is acidic; pH > 7 is basic. Tooth decay begins when mouth pH drops below 5.5.\n3. Important Salts: Bleaching powder CaOCl2, Baking soda NaHCO3, Washing soda Na2CO3.10H2O, Plaster of Paris CaSO4.1/2H2O.",
        "difficulty_level": "standard"
    },
    {
        "id": 8,
        "subject_id": 2,
        "module_number": 4,
        "title": "Science Final Course Assessment",
        "summary_content": "Comprehensive Capstone: Synthesizes Chemical Reactions, Life Processes, and Acid-Base Chemistry.",
        "detailed_content": "Final Assessment Overview:\nThis comprehensive test validates your understanding across chemistry and biology concepts from Class 10 Science.",
        "difficulty_level": "advanced"
    },

    # Subject 5: Class 12 Physics (Science Stream)
    {
        "id": 9,
        "subject_id": 5,
        "module_number": 1,
        "title": "Electric Charges, Fields & Coulomb's Law",
        "summary_content": "Key takeaways: Coulomb's Law F = k * (q1*q2)/r^2. Electric field E = F/q. Electric dipole moment p = q * 2a. Gauss's Law states total flux through closed surface is q_enclosed / epsilon_0.",
        "detailed_content": "Comprehensive Study Guide:\n1. Properties of Charge: Quantization (q = n*e), conservation, additivity.\n2. Coulomb's Law in Vector Form: Electrostatic force between point charges in vacuum.\n3. Gauss's Law Applications: Electric field due to infinitely long straight wire, infinite plane sheet, and thin spherical shell.",
        "difficulty_level": "standard"
    },
    {
        "id": 10,
        "subject_id": 5,
        "module_number": 2,
        "title": "Electrostatic Potential & Capacitance",
        "summary_content": "Key takeaways: Electric potential V = k*q/r. Capacitance of parallel plate capacitor C = epsilon_0 * A / d. Dielectric constant K multiplies capacitance to K*C.",
        "detailed_content": "Comprehensive Study Guide:\n1. Potential Difference: Work done per unit positive charge in moving from infinity to r.\n2. Capacitors in Series and Parallel: Series: 1/C = 1/C1 + 1/C2. Parallel: C = C1 + C2.\n3. Energy Stored in Capacitor: U = 1/2 * C * V^2.",
        "difficulty_level": "standard"
    },

    # Subject 8: Class 12 Computer Science (Science Stream)
    {
        "id": 11,
        "subject_id": 8,
        "module_number": 1,
        "title": "Python Data Structures & Computational Thinking",
        "summary_content": "Key takeaways: Lists (mutable), Tuples (immutable), Dictionaries (key-value hash maps), Sets (unique unordered items). Time complexity of list search is O(n), dict lookup is O(1).",
        "detailed_content": "Comprehensive Study Guide:\n1. Python Memory Model: Mutability vs Immutability. Identity (id) vs equality (==).\n2. Stack Implementation using List: LIFO operations (append as push, pop as pop).\n3. File Handling: text and binary file processing with 'with' context manager.",
        "difficulty_level": "standard"
    },
    {
        "id": 12,
        "subject_id": 8,
        "module_number": 2,
        "title": "Relational Databases & SQL Queries",
        "summary_content": "Key takeaways: Relational model uses tables (relations), rows (tuples), and columns (attributes). DDL: CREATE, ALTER, DROP. DML: SELECT, INSERT, UPDATE, DELETE. Joins: INNER, LEFT.",
        "detailed_content": "Comprehensive Study Guide:\n1. Keys in RDBMS: Primary key, Candidate key, Foreign key for referential integrity.\n2. Aggregate Functions: COUNT(), SUM(), AVG(), MIN(), MAX() with GROUP BY and HAVING clauses.\n3. Table Joins: Combining rows from two or more tables based on a related column.",
        "difficulty_level": "standard"
    }
]

TESTS = [
    {"id": 1, "module_id": 1, "title": "Real Numbers Diagnostic Check", "passing_score": 60.0},
    {"id": 2, "module_id": 2, "title": "Polynomials & Zeroes Verification Test", "passing_score": 60.0},
    {"id": 3, "module_id": 3, "title": "Chemical Reactions & Balancing Check", "passing_score": 60.0},
    {"id": 4, "module_id": 4, "title": "Life Processes & Nutrition Test", "passing_score": 60.0},
    {"id": 5, "module_id": 5, "title": "Linear Equations & Consistency Test", "passing_score": 60.0},
    {"id": 6, "module_id": 6, "title": "Class 10 Mathematics Final Assessment", "passing_score": 65.0},
    {"id": 7, "module_id": 7, "title": "Acids, Bases & pH Scale Test", "passing_score": 60.0},
    {"id": 8, "module_id": 8, "title": "Class 10 Science Final Assessment", "passing_score": 65.0},
    {"id": 9, "module_id": 9, "title": "Electric Charges & Gauss Law Test", "passing_score": 60.0},
    {"id": 10, "module_id": 10, "title": "Potential & Capacitance Test", "passing_score": 60.0},
    {"id": 11, "module_id": 11, "title": "Python Data Structures Assessment", "passing_score": 60.0},
    {"id": 12, "module_id": 12, "title": "Relational Databases & SQL Test", "passing_score": 60.0}
]

TEST_QUESTIONS = [
    # Test 1 (Real Numbers)
    {
        "id": 1, "test_id": 1, "question_number": 1,
        "question_text": "If two positive integers a and b are written as a = x^3 * y^2 and b = x * y^3, where x and y are prime numbers, what is HCF(a, b)?",
        "option_a": "x * y", "option_b": "x * y^2", "option_c": "x^3 * y^3", "option_d": "x^2 * y^2",
        "correct_option": "B",
        "explanation": "HCF is the product of the smallest power of each common prime factor. Smallest power of x is x^1; smallest power of y is y^2. Hence HCF = x * y^2."
    },
    {
        "id": 2, "test_id": 1, "question_number": 2,
        "question_text": "The decimal expansion of 13 / (2^2 * 5) will terminate after how many decimal places?",
        "option_a": "1 decimal place", "option_b": "2 decimal places", "option_c": "3 decimal places", "option_d": "Never terminates",
        "correct_option": "B",
        "explanation": "The maximum power of 2 or 5 in denominator is 2 (from 2^2). Hence the decimal expansion terminates after exactly 2 decimal places."
    },
    {
        "id": 3, "test_id": 1, "question_number": 3,
        "question_text": "If HCF(306, 657) = 9, what is LCM(306, 657)?",
        "option_a": "22338", "option_b": "22388", "option_c": "21338", "option_d": "23338",
        "correct_option": "A",
        "explanation": "Using HCF * LCM = Product of numbers: LCM = (306 * 657) / 9 = 34 * 657 = 22338."
    },

    # Test 2 (Polynomials)
    {
        "id": 4, "test_id": 2, "question_number": 1,
        "question_text": "What is the sum of zeroes of the quadratic polynomial 2x^2 - 8x + 6?",
        "option_a": "4", "option_b": "-4", "option_c": "3", "option_d": "-3",
        "correct_option": "A",
        "explanation": "Sum of zeroes = -b/a = -(-8)/2 = 8/2 = 4."
    },
    {
        "id": 5, "test_id": 2, "question_number": 2,
        "question_text": "If one zero of the quadratic polynomial x^2 + 3x + k is 2, then what is the value of k?",
        "option_a": "10", "option_b": "-10", "option_c": "-7", "option_d": "-2",
        "correct_option": "B",
        "explanation": "Substitute x = 2 into polynomial: 2^2 + 3(2) + k = 0 => 4 + 6 + k = 0 => k = -10."
    },

    # Test 3 (Chemical Reactions)
    {
        "id": 6, "test_id": 3, "question_number": 1,
        "question_text": "Which of the following is an example of an exothermic combination reaction?",
        "option_a": "Decomposition of calcium carbonate",
        "option_b": "Reaction of quicklime (CaO) with water",
        "option_c": "Electrolysis of water",
        "option_d": "Silver chloride turning grey in sunlight",
        "correct_option": "B",
        "explanation": "CaO + H2O -> Ca(OH)2 releases substantial heat, making it both a combination and an exothermic reaction."
    },
    {
        "id": 7, "test_id": 3, "question_number": 2,
        "question_text": "In the reaction: CuO + H2 -> Cu + H2O, which substance is being oxidized?",
        "option_a": "CuO", "option_b": "Cu", "option_c": "H2", "option_d": "H2O",
        "correct_option": "C",
        "explanation": "H2 gains oxygen to form H2O, so H2 is oxidized. CuO loses oxygen, so it is reduced."
    },

    # Test 4 (Life Processes)
    {
        "id": 8, "test_id": 4, "question_number": 1,
        "question_text": "During cellular respiration, the breakdown of pyruvate into carbon dioxide, water, and energy takes place in which cellular organelle?",
        "option_a": "Cytoplasm", "option_b": "Mitochondria", "option_c": "Chloroplast", "option_d": "Nucleus",
        "correct_option": "B",
        "explanation": "Aerobic respiration breaking down 3-carbon pyruvate into CO2 and H2O occurs inside the mitochondria."
    },
    {
        "id": 9, "test_id": 4, "question_number": 2,
        "question_text": "Which enzyme present in saliva breaks down starch into simpler sugars?",
        "option_a": "Pepsin", "option_b": "Trypsin", "option_c": "Salivary Amylase", "option_d": "Lipase",
        "correct_option": "C",
        "explanation": "Saliva contains salivary amylase (ptyalin) which hydrolyzes starch into maltose."
    },

    # Test 5 (Linear Equations)
    {
        "id": 10, "test_id": 5, "question_number": 1,
        "question_text": "If a pair of linear equations is consistent and has a unique solution, what can be said about the ratio of their coefficients a1/a2 and b1/b2?",
        "option_a": "a1/a2 = b1/b2", "option_b": "a1/a2 != b1/b2", "option_c": "a1/a2 = c1/c2", "option_d": "b1/b2 = c1/c2",
        "correct_option": "B",
        "explanation": "For intersecting lines with exactly one unique solution, the ratio a1/a2 must NOT equal b1/b2."
    },
    {
        "id": 11, "test_id": 5, "question_number": 2,
        "question_text": "For what value of k do the equations x + 2y = 3 and 5x + ky = 7 represent parallel lines?",
        "option_a": "10", "option_b": "5", "option_c": "2", "option_d": "15",
        "correct_option": "A",
        "explanation": "For parallel lines: a1/a2 = b1/b2 != c1/c2. Here 1/5 = 2/k => k = 10. Notice 1/5 != 3/7, so they are indeed parallel."
    },

    # Test 6 (Mathematics Final Assessment)
    {
        "id": 12, "test_id": 6, "question_number": 1,
        "question_text": "What is the HCF of the smallest prime number and the smallest composite number?",
        "option_a": "1", "option_b": "2", "option_c": "4", "option_d": "6",
        "correct_option": "B",
        "explanation": "Smallest prime is 2; smallest composite number is 4. HCF(2, 4) = 2."
    },
    {
        "id": 13, "test_id": 6, "question_number": 2,
        "question_text": "If the sum and product of zeroes of a quadratic polynomial are 0 and sqrt(5) respectively, what is the polynomial?",
        "option_a": "x^2 - sqrt(5)", "option_b": "x^2 + sqrt(5)", "option_c": "x^2 - 5", "option_d": "x^2 + 5",
        "correct_option": "B",
        "explanation": "P(x) = x^2 - (Sum)*x + (Product) = x^2 - 0*x + sqrt(5) = x^2 + sqrt(5)."
    },
    {
        "id": 14, "test_id": 6, "question_number": 3,
        "question_text": "The point of intersection of the lines x = 3 and y = -4 is:",
        "option_a": "(-4, 3)", "option_b": "(3, 4)", "option_c": "(3, -4)", "option_d": "(-3, 4)",
        "correct_option": "C",
        "explanation": "The coordinate point where x = 3 and y = -4 intersect is exactly (3, -4)."
    },

    # Test 7 (Acids, Bases & Salts)
    {
        "id": 15, "test_id": 7, "question_number": 1,
        "question_text": "What is the chemical formula of Plaster of Paris?",
        "option_a": "CaSO4 . 2H2O", "option_b": "CaSO4 . 1/2 H2O", "option_c": "CaSO4 . H2O", "option_d": "2CaSO4 . H2O",
        "correct_option": "B",
        "explanation": "Plaster of Paris is calcium sulphate hemihydrate: CaSO4 . 1/2 H2O. Gypsum is CaSO4 . 2H2O."
    },
    {
        "id": 16, "test_id": 7, "question_number": 2,
        "question_text": "Which gas is evolved when an acid reacts with a reactive metal?",
        "option_a": "Oxygen", "option_b": "Carbon dioxide", "option_c": "Hydrogen", "option_d": "Nitrogen",
        "correct_option": "C",
        "explanation": "Metal + Acid -> Salt + Hydrogen gas (tested via 'pop' sound with a burning splinter)."
    },

    # Test 8 (Science Final Assessment)
    {
        "id": 17, "test_id": 8, "question_number": 1,
        "question_text": "Which component of blood is responsible for blood clotting at the site of an injury?",
        "option_a": "RBCs", "option_b": "WBCs", "option_c": "Platelets", "option_d": "Plasma",
        "correct_option": "C",
        "explanation": "Blood platelets form clots to plug leaks at bleeding wound sites."
    },
    {
        "id": 18, "test_id": 8, "question_number": 2,
        "question_text": "A solution turns red litmus paper blue. Its pH is likely to be:",
        "option_a": "1", "option_b": "4", "option_c": "5", "option_d": "10",
        "correct_option": "D",
        "explanation": "Bases turn red litmus blue. Bases have pH > 7, so pH 10 represents a basic solution."
    },
    {
        "id": 19, "test_id": 8, "question_number": 3,
        "question_text": "Which substance is oxidized in: 2PbO + C -> 2Pb + CO2?",
        "option_a": "PbO", "option_b": "Carbon (C)", "option_c": "Lead (Pb)", "option_d": "CO2",
        "correct_option": "B",
        "explanation": "Carbon gains oxygen to form CO2, hence Carbon is oxidized. PbO loses oxygen and is reduced."
    },

    # Test 9 (Class 12 Physics - Electric Charges)
    {
        "id": 20, "test_id": 9, "question_number": 1,
        "question_text": "Two point charges +q and -q are separated by distance 2a. What is the electric dipole moment vector direction?",
        "option_a": "From positive to negative charge",
        "option_b": "From negative to positive charge",
        "option_c": "Perpendicular to the dipole axis",
        "option_d": "Radially outward in all directions",
        "correct_option": "B",
        "explanation": "By physical convention, electric dipole moment p points from negative charge -q to positive charge +q."
    },
    {
        "id": 21, "test_id": 9, "question_number": 2,
        "question_text": "What is the SI unit of electric flux?",
        "option_a": "N / C", "option_b": "N * m / C", "option_c": "N * m^2 / C", "option_d": "C / (N * m^2)",
        "correct_option": "C",
        "explanation": "Flux = Electric Field * Area = (N/C) * m^2 = N * m^2 / C (also expressed as Volt * meter)."
    },

    # Test 10 (Class 12 Physics - Capacitance)
    {
        "id": 22, "test_id": 10, "question_number": 1,
        "question_text": "If a dielectric slab of dielectric constant K is inserted between parallel plates of an isolated charged capacitor, the capacitance:",
        "option_a": "Decreases by 1/K", "option_b": "Remains unchanged", "option_c": "Increases by factor K", "option_d": "Drops to zero",
        "correct_option": "C",
        "explanation": "Insertion of a dielectric increases capacitance to C' = K * C0."
    },
    {
        "id": 23, "test_id": 10, "question_number": 2,
        "question_text": "Three capacitors of capacitance 3 uF each are connected in series. What is the equivalent capacitance?",
        "option_a": "9 uF", "option_b": "1 uF", "option_c": "6 uF", "option_d": "1.5 uF",
        "correct_option": "B",
        "explanation": "In series: 1/C = 1/3 + 1/3 + 1/3 = 3/3 = 1 => C = 1 uF."
    },

    # Test 11 (Class 12 CS - Python Data Structures)
    {
        "id": 24, "test_id": 11, "question_number": 1,
        "question_text": "Which of the following data types in Python is immutable?",
        "option_a": "List", "option_b": "Dictionary", "option_c": "Tuple", "option_d": "Set",
        "correct_option": "C",
        "explanation": "Tuples cannot be altered after creation, making them immutable. Lists, dictionaries, and sets are mutable."
    },
    {
        "id": 25, "test_id": 11, "question_number": 2,
        "question_text": "What is the average time complexity of key lookup in a Python dictionary?",
        "option_a": "O(1)", "option_b": "O(n)", "option_c": "O(log n)", "option_d": "O(n^2)",
        "correct_option": "A",
        "explanation": "Python dictionaries use hash tables, giving them average O(1) constant time complexity for key lookups."
    },

    # Test 12 (Class 12 CS - Relational Databases)
    {
        "id": 26, "test_id": 12, "question_number": 1,
        "question_text": "Which SQL clause is used to filter groups created by the GROUP BY clause?",
        "option_a": "WHERE", "option_b": "HAVING", "option_c": "ORDER BY", "option_d": "LIMIT",
        "correct_option": "B",
        "explanation": "HAVING is used to filter grouped aggregated records; WHERE filters individual rows before grouping."
    },
    {
        "id": 27, "test_id": 12, "question_number": 2,
        "question_text": "A column in a relational table whose values are derived from the Primary Key of another table is known as a:",
        "option_a": "Candidate Key", "option_b": "Alternate Key", "option_c": "Foreign Key", "option_d": "Composite Key",
        "correct_option": "C",
        "explanation": "A Foreign Key establishes a referential relationship linking back to the Primary Key of another table."
    }
]

STUDENT_MODULES = [
    # Aarav Sharma (Struggling on Module 2 with 2 attempts)
    {
        "student_id": 1,
        "module_id": 1,
        "status": "completed",
        "attempts": 1,
        "best_score": 100.0,
        "last_score": 100.0,
        "last_confidence": "Sure"
    },
    {
        "student_id": 1,
        "module_id": 2,
        "status": "in_progress",
        "attempts": 2,
        "best_score": 50.0,
        "last_score": 50.0,
        "last_confidence": "Guessing"
    },
    # Priya Verma (High performer)
    {
        "student_id": 2,
        "module_id": 1,
        "status": "completed",
        "attempts": 1,
        "best_score": 100.0,
        "last_score": 100.0,
        "last_confidence": "Sure"
    },
    {
        "student_id": 2,
        "module_id": 2,
        "status": "completed",
        "attempts": 1,
        "best_score": 100.0,
        "last_score": 100.0,
        "last_confidence": "Sure"
    },
    {
        "student_id": 2,
        "module_id": 5,
        "status": "completed",
        "attempts": 1,
        "best_score": 100.0,
        "last_score": 100.0,
        "last_confidence": "Sure"
    },
    # Kabir Roy (Moderate performer - Monitor)
    {
        "student_id": 3,
        "module_id": 1,
        "status": "completed",
        "attempts": 1,
        "best_score": 66.7,
        "last_score": 66.7,
        "last_confidence": "Guessing"
    }
]

TEST_ATTEMPTS = [
    # Aarav's attempt 1 on Test 2 (Failed, guessing)
    {
        "id": 1,
        "student_id": 1,
        "test_id": 2,
        "attempt_number": 1,
        "score": 0.0,
        "total_questions": 2,
        "correct_count": 0,
        "sure_count": 0,
        "guessing_count": 2
    },
    # Aarav's attempt 2 on Test 2 (Failed, mixed confidence)
    {
        "id": 2,
        "student_id": 1,
        "test_id": 2,
        "attempt_number": 2,
        "score": 50.0,
        "total_questions": 2,
        "correct_count": 1,
        "sure_count": 1,
        "guessing_count": 1
    },
    # Priya's attempt 1 on Test 1 (High performer, all Sure)
    {
        "id": 3,
        "student_id": 2,
        "test_id": 1,
        "attempt_number": 1,
        "score": 100.0,
        "total_questions": 3,
        "correct_count": 3,
        "sure_count": 3,
        "guessing_count": 0
    },
    # Kabir's attempt 1 on Test 1 (Moderate performer, mixed Guessing)
    {
        "id": 4,
        "student_id": 3,
        "test_id": 1,
        "attempt_number": 1,
        "score": 66.7,
        "total_questions": 3,
        "correct_count": 2,
        "sure_count": 1,
        "guessing_count": 2
    }
]

TEST_ANSWERS = [
    # Attempt 1 answers (Aarav)
    {
        "id": 1,
        "attempt_id": 1,
        "question_id": 4, # Polynomials Q1
        "selected_option": "B",
        "is_correct": 0,
        "confidence": "Guessing"
    },
    {
        "id": 2,
        "attempt_id": 1,
        "question_id": 5, # Polynomials Q2
        "selected_option": "A",
        "is_correct": 0,
        "confidence": "Guessing"
    },
    # Attempt 2 answers (Aarav)
    {
        "id": 3,
        "attempt_id": 2,
        "question_id": 4, # Polynomials Q1
        "selected_option": "A",
        "is_correct": 1,
        "confidence": "Sure"
    },
    {
        "id": 4,
        "attempt_id": 2,
        "question_id": 5, # Polynomials Q2
        "selected_option": "C",
        "is_correct": 0,
        "confidence": "Guessing"
    },
    # Attempt 3 answers (Priya - Test 1)
    {
        "id": 5,
        "attempt_id": 3,
        "question_id": 1,
        "selected_option": "B",
        "is_correct": 1,
        "confidence": "Sure"
    },
    {
        "id": 6,
        "attempt_id": 3,
        "question_id": 2,
        "selected_option": "A",
        "is_correct": 1,
        "confidence": "Sure"
    },
    {
        "id": 7,
        "attempt_id": 3,
        "question_id": 3,
        "selected_option": "B",
        "is_correct": 1,
        "confidence": "Sure"
    },
    # Attempt 4 answers (Kabir - Test 1)
    {
        "id": 8,
        "attempt_id": 4,
        "question_id": 1,
        "selected_option": "B",
        "is_correct": 1,
        "confidence": "Sure"
    },
    {
        "id": 9,
        "attempt_id": 4,
        "question_id": 2,
        "selected_option": "C",
        "is_correct": 0,
        "confidence": "Guessing"
    },
    {
        "id": 10,
        "attempt_id": 4,
        "question_id": 3,
        "selected_option": "B",
        "is_correct": 1,
        "confidence": "Guessing"
    }
]

ATTENDANCE = [
    {
        "student_id": 1,
        "subject_id": 1, # Math
        "total_classes": 30,
        "attended_classes": 20,
        "attendance_percentage": 66.7,
        "trend": "declining",
        "consecutive_missed": 3
    },
    {
        "student_id": 1,
        "subject_id": 2, # Science
        "total_classes": 28,
        "attended_classes": 21,
        "attendance_percentage": 75.0,
        "trend": "declining",
        "consecutive_missed": 2
    },
    {
        "student_id": 2,
        "subject_id": 1, # Math
        "total_classes": 30,
        "attended_classes": 29,
        "attendance_percentage": 96.7,
        "trend": "stable",
        "consecutive_missed": 0
    },
    {
        "student_id": 3,
        "subject_id": 1, # Math
        "total_classes": 30,
        "attended_classes": 24,
        "attendance_percentage": 80.0,
        "trend": "stable",
        "consecutive_missed": 1
    }
]

MARKS = [
    {
        "student_id": 1,
        "subject_id": 1,
        "assessment_name": "Unit Assessment 1",
        "marks_obtained": 48.0,
        "total_marks": 100.0,
        "percentage": 48.0,
        "grade": "C2"
    },
    {
        "student_id": 1,
        "subject_id": 2,
        "assessment_name": "Unit Assessment 1",
        "marks_obtained": 62.0,
        "total_marks": 100.0,
        "percentage": 62.0,
        "grade": "B2"
    },
    {
        "student_id": 2,
        "subject_id": 1,
        "assessment_name": "Unit Assessment 1",
        "marks_obtained": 94.0,
        "total_marks": 100.0,
        "percentage": 94.0,
        "grade": "A1"
    }
]

RESOURCES = [
    {
        "id": 1,
        "title": "NCERT Mathematics Class 10 Textbook (Offline PDF)",
        "resource_type": "textbook",
        "subject_id": 1,
        "class": "Class 10",
        "content_url": "/resources/ncert-math-10.pdf",
        "access_requirement": "offline_friendly",
        "description": "Baseline official textbook chapter files formatted for offline reading with screen reader alt-text.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 2,
        "title": "Real Numbers & LCM/HCF Interactive Guide",
        "resource_type": "article",
        "subject_id": 1,
        "class": "Class 10",
        "content_url": "/resources/real-numbers-guide",
        "access_requirement": "low_bandwidth",
        "description": "Text-heavy interactive examples with step-by-step factorization exercises.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 3,
        "title": "Chemical Reactions & Equations Video Lecture with Captions",
        "resource_type": "video",
        "subject_id": 2,
        "class": "Class 10",
        "content_url": "/resources/chem-reactions-video",
        "access_requirement": "high_speed",
        "description": "Illustrated animated experiments with verified verbatim subtitles and full audio transcript.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 4,
        "title": "Offline Pocket Formula Sheet for Class 10 Science",
        "resource_type": "textbook",
        "subject_id": 2,
        "class": "Class 10",
        "content_url": "/resources/science-formulas.pdf",
        "access_requirement": "offline_friendly",
        "description": "Quick revision card designed for zero-connectivity study and high-contrast printing.",
        "has_captions": 1,
        "has_transcript": 1
    }
]

SCHOLARSHIPS = [
    {
        "id": 1,
        "title": "National Pre-Matric Merit Scholarship",
        "provider": "Ministry of Social Justice & Empowerment",
        "description": "Financial assistance for meritorious students from low-income families enrolled in secondary education.",
        "amount": "₹25,000 / year",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 50.0,
        "category_requirement": "All",
        "max_income_limit": 250000.0,
        "disability_required": 0,
        "deadline": "2026-10-31",
        "application_url": "https://scholarships.gov.in/pre-matric",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 2,
        "title": "Divyangjan Inclusive Education Fellowship",
        "provider": "Department of Empowerment of Persons with Disabilities",
        "description": "Dedicated equipment stipend and tuition waiver for students with visual, hearing, or orthopedic disabilities.",
        "amount": "₹45,000 / year + Assistive Kit",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 45.0,
        "category_requirement": "Disability",
        "max_income_limit": 300000.0,
        "disability_required": 1,
        "deadline": "2026-09-19",
        "application_url": "https://scholarships.gov.in/divyangjan",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 3,
        "title": "Pragati STEM Scholarship for Girls",
        "provider": "AICTE Support Scheme",
        "description": "Encouraging young women pursuing tech, science, and computing pathways.",
        "amount": "₹50,000 / year",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 60.0,
        "category_requirement": "All",
        "max_income_limit": 800000.0,
        "disability_required": 0,
        "deadline": "2026-11-15",
        "application_url": "https://aicte-pragati.gov.in",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 4,
        "title": "Post-Matric SC/ST Academic Advancement Grant",
        "provider": "State Welfare Board",
        "description": "Direct financial aid to cover textbooks, digital accessibility tools, and exam fees.",
        "amount": "₹30,000 / year",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 50.0,
        "category_requirement": "SC",
        "max_income_limit": 250000.0,
        "disability_required": 0,
        "deadline": "2026-10-15",
        "application_url": "https://scholarships.gov.in/sc-st-aid",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 5,
        "title": "Tata Trust Educational Excellence Grant",
        "provider": "Sir Ratan Tata Trust",
        "description": "Targeted educational grant for underprivileged students showing consistent academic resilience.",
        "amount": "₹60,000 / year",
        "eligible_class": "Class 10",
        "eligible_stream": "General",
        "min_academic_percentage": 70.0,
        "category_requirement": "All",
        "max_income_limit": 150000.0,
        "disability_required": 0,
        "deadline": "2026-09-23",
        "application_url": "https://tatatrusts.org/education-grant",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 6,
        "title": "CBSE Merit Scholarship for Single Girl Child",
        "provider": "Central Board of Secondary Education",
        "description": "Merit award for single girl children who have demonstrated high academic enthusiasm.",
        "amount": "₹18,000 / year",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 60.0,
        "category_requirement": "All",
        "max_income_limit": 0.0,
        "disability_required": 0,
        "deadline": "2026-09-20",
        "application_url": "https://cbse.nic.in/scholarships",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 7,
        "title": "Immediate State Emergency Hardship Grant",
        "provider": "Department of School Education",
        "description": "Emergency hardship relief for essential secondary textbooks, stationery, and lab kits.",
        "amount": "₹12,000 one-time",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 40.0,
        "category_requirement": "All",
        "max_income_limit": 300000.0,
        "disability_required": 0,
        "deadline": "2026-09-18",
        "application_url": "https://schooleducation.gov.in/emergency-aid",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 8,
        "title": "Rural Connectivity & Digital Device Assistance",
        "provider": "Inclusive Learning Alliance",
        "description": "Provides low-cost tablets and offline curriculum kits to students with intermittent or zero internet access.",
        "amount": "Tablet + ₹10,000",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 40.0,
        "category_requirement": "All",
        "max_income_limit": 150000.0,
        "disability_required": 0,
        "deadline": "2026-09-25",
        "application_url": "https://inclusive-learning.org/device-aid",
        "is_active": 1,
        "created_by": 4
    },
    {
        "id": 9,
        "title": "Past Foundation Education Grant (Archived)",
        "provider": "Legacy Education Trust",
        "description": "Previous semester academic grant posting archived for institutional records.",
        "amount": "₹15,000",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 50.0,
        "category_requirement": "All",
        "max_income_limit": 200000.0,
        "disability_required": 0,
        "deadline": "2026-09-10",
        "application_url": "https://legacytrust.org/past-grant",
        "is_active": 0,
        "created_by": 4
    }
]

RESOURCES = [
    {
        "id": 1,
        "title": "NCERT Mathematics Class 10 Digital Textbook",
        "resource_type": "textbook",
        "format": "text",
        "subject_id": 1,
        "class": "Class 10",
        "content_url": "https://ncert.nic.in/textbook.php?jemh1=0-15",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 12.5,
        "description": "Official complete Class 10 NCERT Mathematics textbook chapters in downloadable offline PDF format.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 2,
        "title": "Class 10 Real Numbers & Polynomials Formula Reference Card",
        "resource_type": "document",
        "format": "text",
        "subject_id": 1,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/resources/math-class10-formulas.pdf",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 0.5,
        "description": "Single-page printable cheat sheet covering Euclid's Lemma, fundamental arithmetic theorem, and polynomial zeroes.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 3,
        "title": "Real Numbers & Coordinate Geometry Audio Masterclass",
        "resource_type": "article",
        "format": "audio",
        "subject_id": 1,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/audio/math-real-numbers.mp3",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 8.2,
        "description": "Clear, screen-reader optimized spoken audio walkthrough of core algebra concepts and theorems with descriptive explanations.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 4,
        "title": "Interactive Polynomials Grapher & Zeroes Visualizer",
        "resource_type": "interactive",
        "format": "visual",
        "subject_id": 1,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/interactive/polynomial-graphs",
        "access_requirement": "high_speed",
        "is_downloadable": 0,
        "language": "en",
        "estimated_size_mb": 3.5,
        "description": "Web-based interactive sandbox for visualizing quadratic curves, parabolic trajectories, and vertex transformations in real time.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 5,
        "title": "NCERT Science Class 10 Complete Illustrated Textbook",
        "resource_type": "textbook",
        "format": "visual",
        "subject_id": 2,
        "class": "Class 10",
        "content_url": "https://ncert.nic.in/textbook.php?jesc1=0-16",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 18.0,
        "description": "Full digital textbook covering chemical reactions, life processes, light optics, and electricity with high-contrast diagrams.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 6,
        "title": "Chemical Reactions & Balancing Concise Study Notes (Hindi/English)",
        "resource_type": "article",
        "format": "text",
        "subject_id": 2,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/resources/chem-reactions-bilingual.pdf",
        "access_requirement": "low_bandwidth",
        "is_downloadable": 1,
        "language": "hi",
        "estimated_size_mb": 1.2,
        "description": "Bilingual summary notes explaining exothermic, endothermic, and redox reactions with balanced chemical equation tables.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 7,
        "title": "Cellular Respiration & Human Circulation 3D Animated Video Lecture",
        "resource_type": "video",
        "format": "visual",
        "subject_id": 2,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/videos/respiration-circulation-3d",
        "access_requirement": "high_speed",
        "is_downloadable": 0,
        "language": "en",
        "estimated_size_mb": 45.0,
        "description": "Detailed 3D animated walkthrough of human digestive and respiratory mechanisms. Features verified English closed captions and synchronized verbatim transcript.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 8,
        "title": "Life Processes Audio Explanatory Guide for Inclusive Learning",
        "resource_type": "article",
        "format": "audio",
        "subject_id": 2,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/audio/life-processes-guide.mp3",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 6.4,
        "description": "Engaging audio overview of autotrophic nutrition, stomata gas exchange, and kidney filtration designed for auditory learners.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 9,
        "title": "Python Programming for Beginners: Offline Reference Guide",
        "resource_type": "textbook",
        "format": "text",
        "subject_id": 8,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/resources/python-offline-guide.pdf",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 4.8,
        "description": "Comprehensive offline textbook introducing variables, control flow, loops, lists, and file operations without requiring internet connectivity.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 10,
        "title": "Web Development Basics: Semantic HTML5 & CSS Layouts Guide",
        "resource_type": "article",
        "format": "visual",
        "subject_id": 8,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/resources/web-basics-guide.html",
        "access_requirement": "low_bandwidth",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 1.5,
        "description": "Visual guide with diagrams explaining the DOM tree, flexbox grids, and web accessibility standards (ARIA).",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 11,
        "title": "Interactive Python & SQL Sandbox Playground",
        "resource_type": "interactive",
        "format": "interactive",
        "subject_id": 8,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/interactive/python-sql-lab",
        "access_requirement": "high_speed",
        "is_downloadable": 0,
        "language": "en",
        "estimated_size_mb": 5.0,
        "description": "Live in-browser coding playground for running Python scripts and executing relational SQL database queries.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 12,
        "title": "Cyber Hygiene & Internet Safety Audio Handbook",
        "resource_type": "article",
        "format": "audio",
        "subject_id": 8,
        "class": "Class 10",
        "content_url": "https://beyondbarriers.edu/audio/cyber-safety-handbook.mp3",
        "access_requirement": "low_bandwidth",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 5.1,
        "description": "Practical audio guidelines covering phishing prevention, password security, two-factor authentication, and safe browsing.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 13,
        "title": "Class 12 Physics: Electrostatics & Gauss Law Illustrated Guide",
        "resource_type": "textbook",
        "format": "visual",
        "subject_id": 3,
        "class": "Class 12",
        "content_url": "https://beyondbarriers.edu/resources/physics-electrostatics.pdf",
        "access_requirement": "offline_friendly",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 9.0,
        "description": "Illustrated derivations of Coulomb's Law, electric field intensity, flux, and Gauss law applications for Class 12 Science.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 14,
        "title": "Organic Chemistry Mechanisms & IUPAC Nomenclature Summary",
        "resource_type": "article",
        "format": "text",
        "subject_id": 4,
        "class": "Class 12",
        "content_url": "https://beyondbarriers.edu/resources/chemistry-organic-summary.pdf",
        "access_requirement": "low_bandwidth",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 2.1,
        "description": "Quick revision notes on reaction mechanisms, nucleophilic substitutions, and standard IUPAC nomenclature rules.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 15,
        "title": "Genetics & Molecular Biology Video Lecture Series",
        "resource_type": "video",
        "format": "visual",
        "subject_id": 5,
        "class": "Class 12",
        "content_url": "https://beyondbarriers.edu/videos/genetics-molecular-dna",
        "access_requirement": "high_speed",
        "is_downloadable": 0,
        "language": "en",
        "estimated_size_mb": 52.0,
        "description": "High-definition video lectures covering DNA replication, transcription, and Mendelian inheritance with transcripts and captions.",
        "has_captions": 1,
        "has_transcript": 1
    },
    {
        "id": 16,
        "title": "Data Science & Statistics Concept Primer (Text & Infographics)",
        "resource_type": "article",
        "format": "visual",
        "subject_id": 8,
        "class": "All",
        "content_url": "https://beyondbarriers.edu/resources/data-science-primer.pdf",
        "access_requirement": "low_bandwidth",
        "is_downloadable": 1,
        "language": "en",
        "estimated_size_mb": 2.8,
        "description": "Visual introduction to mean, median, standard deviation, correlation matrices, and foundational data science concepts.",
        "has_captions": 1,
        "has_transcript": 1
    }
]

CAREER_FIELDS = [
    {
        "id": 1,
        "name": "Artificial Intelligence & Machine Learning",
        "description": "Building intelligent systems that learn from patterns, automate reasoning, and solve complex problems.",
        "icon": "Cpu"
    },
    {
        "id": 2,
        "name": "Cybersecurity & Information Defense",
        "description": "Protecting digital infrastructures, software, networks, and user data from vulnerabilities and cyber threats.",
        "icon": "Shield"
    },
    {
        "id": 3,
        "name": "Full-Stack Web Development",
        "description": "Crafting accessible, scalable, interactive web platforms and modern web applications.",
        "icon": "Code"
    },
    {
        "id": 4,
        "name": "Data Science & Analytics",
        "description": "Uncovering insights from structured and unstructured data to guide informed decisions.",
        "icon": "BarChart3"
    }
]

CAREER_ROLES = [
    {
        "id": 1,
        "career_field_id": 1,
        "title": "AI & Machine Learning Engineer",
        "description": "Designs and trains predictive models, neural networks, and generative AI agents.",
        "average_salary_range": "₹8 LPA – ₹24 LPA",
        "related_roles": "Data Scientist, Computer Vision Specialist, AI Safety Engineer, NLP Engineer",
        "suggested_learning_areas": "Linear Algebra, Probability, Python, Deep Learning, Model Deployment"
    },
    {
        "id": 2,
        "career_field_id": 2,
        "title": "Cybersecurity Analyst",
        "description": "Monitors network anomalies, conducts vulnerability audits, and secures application endpoints.",
        "average_salary_range": "₹6 LPA – ₹18 LPA",
        "related_roles": "Security Engineer, Penetration Tester, Incident Responder, Information Security Specialist",
        "suggested_learning_areas": "Computer Networks, Linux Administration, Cryptography, Vulnerability Assessment"
    },
    {
        "id": 3,
        "career_field_id": 3,
        "title": "Full-Stack Web Developer",
        "description": "Develops responsive frontend user interfaces, backend APIs, and database architectures.",
        "average_salary_range": "₹5 LPA – ₹16 LPA",
        "related_roles": "Frontend Engineer, Backend Architect, DevOps Engineer, Mobile App Developer",
        "suggested_learning_areas": "JavaScript / TypeScript, React, Python / Node.js, Database Architecture"
    },
    {
        "id": 4,
        "career_field_id": 4,
        "title": "Data Analyst",
        "description": "Extracts, cleans, and visualizes complex datasets to communicate actionable metrics.",
        "average_salary_range": "₹5 LPA – ₹15 LPA",
        "related_roles": "Business Intelligence Analyst, Data Engineer, Analytics Consultant, Quantitative Researcher",
        "suggested_learning_areas": "SQL, Python Pandas, Data Visualization, Statistical Hypothesis Testing"
    }
]

CAREER_ROADMAP_STEPS = [
    # AI & ML Engineer (4 Stages)
    {
        "career_role_id": 1,
        "stage": "Foundation",
        "stage_order": 1,
        "title": "Mathematical & Algorithmic Foundations",
        "description": "Build fluency in linear algebra (matrices, vectors), basic calculus (gradients), probability, and Python programming syntax.",
        "key_skills": "Python Basics, Linear Algebra, Probability & Statistics, Logic",
        "recommended_projects": "Calculator CLI, Matrix Multiplication program, Basic statistics notebook",
        "learning_resources": '[{"title": "Khan Academy Linear Algebra", "url": "https://www.khanacademy.org/math/linear-algebra", "type": "free"}, {"title": "Python for Everybody", "url": "https://www.py4e.com/", "type": "open_source"}]'
    },
    {
        "career_role_id": 1,
        "stage": "Core Skills",
        "stage_order": 2,
        "title": "Data Manipulation & Classical Machine Learning",
        "description": "Master data handling with NumPy and Pandas. Learn supervised and unsupervised algorithms (linear regression, decision trees, k-means).",
        "key_skills": "NumPy, Pandas, Scikit-Learn, Supervised Learning, Data Cleaning",
        "recommended_projects": "Housing Price Predictor, Student Grade Classifier, Customer Segmentation",
        "learning_resources": '[{"title": "Scikit-Learn Official User Guide", "url": "https://scikit-learn.org/stable/user_guide.html", "type": "open_source"}, {"title": "Kaggle Micro-Courses", "url": "https://www.kaggle.com/learn", "type": "free"}]'
    },
    {
        "career_role_id": 1,
        "stage": "Advanced Skills",
        "stage_order": 3,
        "title": "Deep Learning & Neural Architectures",
        "description": "Explore feedforward networks, CNNs for computer vision, RNNs/Transformers for natural language processing using PyTorch or TensorFlow.",
        "key_skills": "PyTorch, Deep Learning, CNNs, NLP, Transfer Learning",
        "recommended_projects": "Handwritten Digit Recognizer, Sentiment Analysis on Reviews, Object Detection Model",
        "learning_resources": '[{"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "type": "open_source"}, {"title": "Fast.ai Practical Deep Learning", "url": "https://course.fast.ai/", "type": "free"}]'
    },
    {
        "career_role_id": 1,
        "stage": "Career Preparation",
        "stage_order": 4,
        "title": "Deployment, Open Source & Portfolio",
        "description": "Deploy models as REST APIs using FastAPI/Flask. Build interactive demos on HuggingFace and contribute to open-source AI projects.",
        "key_skills": "Model Serving (Flask/FastAPI), Docker, Git, HuggingFace, Resume & Mock Interviews",
        "recommended_projects": "End-to-End AI Web App deployed live with public API documentation",
        "learning_resources": '[{"title": "Hugging Face Spaces Guide", "url": "https://huggingface.co/docs/hub/spaces", "type": "free"}, {"title": "Full Stack Deep Learning", "url": "https://fullstackdeeplearning.com/", "type": "free"}]'
    },

    # Cybersecurity Analyst (4 Stages)
    {
        "career_role_id": 2,
        "stage": "Foundation",
        "stage_order": 1,
        "title": "Networking & Operating System Fundamentals",
        "description": "Understand core internet protocols (TCP/IP, UDP, DNS, HTTP/S), Linux shell commands, permissions, and network topology.",
        "key_skills": "TCP/IP, OSI Model, Linux Terminal, Command-Line Utilities, Bash Scripting",
        "recommended_projects": "Network Packet Sniffer script, Automated Linux hardening script",
        "learning_resources": '[{"title": "Linux Journey", "url": "https://linuxjourney.com/", "type": "open_source"}, {"title": "Professor Messer Network+ Course", "url": "https://www.professormesser.com/", "type": "free"}]'
    },
    {
        "career_role_id": 2,
        "stage": "Core Skills",
        "stage_order": 2,
        "title": "Security Principles, Cryptography & Threat Analysis",
        "description": "Learn public-key cryptography, SSL/TLS handshakes, hashing algorithms, firewall configuration, and network packet analysis.",
        "key_skills": "Symmetric/Asymmetric Encryption, Hashing, Firewalls, Wireshark, Port Scanning (Nmap)",
        "recommended_projects": "Port Scanner CLI, File Integrity Checker using SHA-256",
        "learning_resources": '[{"title": "Cybrary Introduction to IT & Cybersecurity", "url": "https://www.cybrary.it/", "type": "free"}, {"title": "Wireshark University Tutorials", "url": "https://www.wireshark.org/docs/", "type": "free"}]'
    },
    {
        "career_role_id": 2,
        "stage": "Advanced Skills",
        "stage_order": 3,
        "title": "Vulnerability Assessment & Defense Operations",
        "description": "Analyze common vulnerabilities (SQLi, XSS, CSRF), configure SIEM monitoring tools, and analyze intrusion logs.",
        "key_skills": "OWASP Top 10, SIEM Monitoring, Incident Response, Penetration Testing Basics, Log Analysis",
        "recommended_projects": "Web Application Vulnerability Audit Report, Simple SIEM alert dashboard",
        "learning_resources": '[{"title": "OWASP Foundation Top 10 Guide", "url": "https://owasp.org/www-project-top-ten/", "type": "open_source"}, {"title": "OverTheWire Wargames (Bandit)", "url": "https://overthewire.org/wargames/bandit/", "type": "free"}]'
    },
    {
        "career_role_id": 2,
        "stage": "Career Preparation",
        "stage_order": 4,
        "title": "Certifications, Mock Audits & Portfolio",
        "description": "Familiarize with standard cybersecurity frameworks (NIST CSF, ISO 27001), prepare for foundational certifications (CompTIA Security+), and write audit reports.",
        "key_skills": "Security Auditing, Compliance Frameworks (ISO 27001/NIST), Technical Writing, Interview Prep",
        "recommended_projects": "Comprehensive Security Assessment Portfolio on GitHub",
        "learning_resources": '[{"title": "NIST Cybersecurity Framework", "url": "https://www.nist.gov/cyberframework", "type": "open_source"}, {"title": "TryHackMe Practice Labs", "url": "https://tryhackme.com/", "type": "free"}]'
    },

    # Full-Stack Web Developer (4 Stages)
    {
        "career_role_id": 3,
        "stage": "Foundation",
        "stage_order": 1,
        "title": "Web Foundations & Semantic Markup",
        "description": "Learn HTML5 semantics, responsive Vanilla CSS, flexbox/grid layout systems, and fundamental JavaScript ES6+.",
        "key_skills": "HTML5, Semantic UI, Responsive CSS, JavaScript ES6+, DOM Manipulation",
        "recommended_projects": "Accessible Portfolio Website, Interactive Quiz App",
        "learning_resources": '[{"title": "MDN Web Docs: Web Development", "url": "https://developer.mozilla.org/", "type": "open_source"}, {"title": "The Odin Project: Foundations", "url": "https://www.theodinproject.com/", "type": "free"}]'
    },
    {
        "career_role_id": 3,
        "stage": "Core Skills",
        "stage_order": 2,
        "title": "Component Frameworks & Client-Side Architecture",
        "description": "Build single-page applications with React. Master state management, component hooks, accessible routing, and API data fetching.",
        "key_skills": "React, React Router, State Management, Fetch/Axios, Component Design",
        "recommended_projects": "Task & Learning Tracker, Dynamic Dashboard with Search & Filter",
        "learning_resources": '[{"title": "React Official Documentation", "url": "https://react.dev/", "type": "open_source"}, {"title": "Scrimba Frontend Career Path", "url": "https://scrimba.com/", "type": "free"}]'
    },
    {
        "career_role_id": 3,
        "stage": "Advanced Skills",
        "stage_order": 3,
        "title": "Backend APIs & Relational Databases",
        "description": "Develop RESTful APIs using Python Flask or Node.js. Design relational schemas, foreign keys, and indexes in SQLite/PostgreSQL.",
        "key_skills": "Flask/Express, REST API Design, SQLite/PostgreSQL, Authentication",
        "recommended_projects": "Education Support API with Role-Based Scope Enforcement",
        "learning_resources": '[{"title": "Flask Mega-Tutorial", "url": "https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world", "type": "free"}, {"title": "PostgreSQL Exercises", "url": "https://pgexercises.com/", "type": "free"}]'
    },
    {
        "career_role_id": 3,
        "stage": "Career Preparation",
        "stage_order": 4,
        "title": "Testing, Deployment & System Integration",
        "description": "Implement automated testing, CI/CD pipelines, containerization, and production deployment on cloud platforms.",
        "key_skills": "Git/GitHub, CI/CD, Unit Testing, Performance Optimization, Code Reviews",
        "recommended_projects": "Full-Stack production application with end-to-end user workflows",
        "learning_resources": '[{"title": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions", "type": "open_source"}, {"title": "Web.dev Accessibility & Performance Guides", "url": "https://web.dev/", "type": "free"}]'
    },

    # Data Analyst (4 Stages)
    {
        "career_role_id": 4,
        "stage": "Foundation",
        "stage_order": 1,
        "title": "Data Literacy, Spreadsheets & SQL Basics",
        "description": "Master structured data queries (SELECT, WHERE, JOIN, GROUP BY), data cleansing, and formula calculation in spreadsheets.",
        "key_skills": "Excel/Sheets Formulas, Pivot Tables, SQL SELECT/JOIN/GROUP BY, Basic Descriptive Stats",
        "recommended_projects": "Sales Trend Analysis Spreadsheet, Student Exam Results SQL Database",
        "learning_resources": '[{"title": "SQLZoo Interactive Tutorials", "url": "https://sqlzoo.net/", "type": "free"}, {"title": "StatQuest with Josh Starmer: Statistics Basics", "url": "https://statquest.org/", "type": "free"}]'
    },
    {
        "career_role_id": 4,
        "stage": "Core Skills",
        "stage_order": 2,
        "title": "Python for Data Analysis & Visualization",
        "description": "Use Pandas and NumPy for filtering, transforming, and summarizing datasets. Create descriptive charts using Matplotlib and Seaborn.",
        "key_skills": "NumPy, Pandas DataFrames, Matplotlib, Seaborn, Exploratory Data Analysis (EDA)",
        "recommended_projects": "Public Health Exploratory Data Analysis, E-commerce Customer Metrics Report",
        "learning_resources": '[{"title": "Python Data Science Handbook", "url": "https://jakevdp.github.io/PythonDataScienceHandbook/", "type": "open_source"}, {"title": "Kaggle Pandas Tutorial", "url": "https://www.kaggle.com/learn/pandas", "type": "free"}]'
    },
    {
        "career_role_id": 4,
        "stage": "Advanced Skills",
        "stage_order": 3,
        "title": "BI Dashboards & Statistical Modeling",
        "description": "Construct interactive multi-tab BI dashboards. Conduct statistical hypothesis tests and interpret confidence intervals and p-values.",
        "key_skills": "Tableau/Power BI, Interactive Dashboards, Hypothesis Testing (t-tests, ANOVA), Regression Analysis",
        "recommended_projects": "Interactive Educational Equity BI Dashboard, A/B Test Experimentation Notebook",
        "learning_resources": '[{"title": "Tableau Public Training Videos", "url": "https://www.tableau.com/learn/training", "type": "free"}, {"title": "OpenIntro Statistics Textbook", "url": "https://www.openintro.org/book/os/", "type": "open_source"}]'
    },
    {
        "career_role_id": 4,
        "stage": "Career Preparation",
        "stage_order": 4,
        "title": "Data Storytelling, Case Studies & Portfolio",
        "description": "Translate analytical findings into executive summaries and actionable insights. Publish documented end-to-end projects on GitHub.",
        "key_skills": "Business Communication, Executive Summaries, GitHub Portfolio, Technical Case Study Prep",
        "recommended_projects": "End-to-End Data Analysis Portfolio with Actionable Recommendations",
        "learning_resources": '[{"title": "Storytelling with Data Guide", "url": "https://www.storytellingwithdata.com/", "type": "free"}, {"title": "Data Analyst Portfolio Guide on Towards Data Science", "url": "https://towardsdatascience.com/", "type": "free"}]'
    }
]

MENTOR_NOTES = [
    {
        "id": 1,
        "mentor_id": 1, # Dr. Radhika Sen (Assigned range 1-20)
        "student_id": 1, # Aarav Sharma (Roll 14)
        "note": "Aarav demonstrated solid understanding of Module 1 (Real Numbers), but faced difficulty with Polynomials (failed Module 2 test twice). Missed 3 consecutive classes this month. Recommending supplemental audio-guided practice questions and scheduled check-in.",
        "share_with_parent": 1,
        "follow_up_completed": 0
    },
    {
        "id": 2,
        "mentor_id": 1,
        "student_id": 1,
        "note": "Private internal counselor review: Discussed internet connectivity challenges. Aarav requires offline formula cards and textbook PDFs for home study.",
        "share_with_parent": 0, # NOT shared with parent (strictly private mentor note)
        "follow_up_completed": 0
    },
    {
        "id": 3,
        "mentor_id": 1,
        "student_id": 2, # Priya Verma (Roll 5)
        "note": "Priya has maintained 96% attendance and achieved 100% on both modules. Recommended her for the Pragati STEM scholarship posting.",
        "share_with_parent": 1,
        "follow_up_completed": 1
    }
]

USERS = [
    {
        "id": 1,
        "username": "student1",
        "password": "password123",
        "role": "student",
        "student_id": 1,
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 2,
        "username": "student2",
        "password": "password123",
        "role": "student",
        "student_id": 2,
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 3,
        "username": "mentor1",
        "password": "password123",
        "role": "mentor",
        "student_id": None,
        "mentor_id": 1, # Dr. Radhika Sen (Roll 1-20)
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 4,
        "username": "mentor2",
        "password": "password123",
        "role": "mentor",
        "student_id": None,
        "mentor_id": 2, # Prof. Vikram Joshi (Roll 21-40)
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 5,
        "username": "parent1",
        "password": "password123",
        "role": "parent",
        "student_id": None,
        "mentor_id": None,
        "parent_id": 1, # Sunita Sharma (Linked to Student 1 Aarav)
        "administrator_id": None
    },
    {
        "id": 6,
        "username": "parent2",
        "password": "password123",
        "role": "parent",
        "student_id": None,
        "mentor_id": None,
        "parent_id": 2, # Rajesh Verma (Linked to Student 2 Priya)
        "administrator_id": None
    },
    {
        "id": 7,
        "username": "admin1",
        "password": "password123",
        "role": "administrator",
        "student_id": None,
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": 1 # P. K. Verma
    },
    {
        "id": 8,
        "username": "newstudent",
        "password": "password123",
        "role": "student",
        "student_id": 11,
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 9,
        "username": "student8",
        "password": "password123",
        "role": "student",
        "student_id": 8, # Meera Nair (Visual Disability)
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 10,
        "username": "student3",
        "password": "password123",
        "role": "student",
        "student_id": 3, # Kabir Roy (Roll 19)
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": None
    },
    {
        "id": 11,
        "username": "student5",
        "password": "password123",
        "role": "student",
        "student_id": 5, # Rohan Deshmukh (Zero Internet / Offline Profile)
        "mentor_id": None,
        "parent_id": None,
        "administrator_id": None
    }
]

# ============================================================================
# BKT CONCEPT & LESSON RECOMMENDATION ENGINE SEEDS (CLASS 10 CBSE)
# ============================================================================

CONCEPTS = [
    {
        "id": 1,
        "chapter_id": 2, # Polynomials & Quadratic Relations
        "name": "Standard Form & Zeroes of Quadratic Equations",
        "description": "Understanding ax^2 + bx + c = 0, degree 2 polynomials, and zeroes.",
        "prerequisite_concept_id": None
    },
    {
        "id": 2,
        "chapter_id": 2, # Polynomials & Quadratic Relations
        "name": "Solving Quadratic Equations by Factorisation",
        "description": "Splitting the middle term to solve quadratic equations.",
        "prerequisite_concept_id": 1
    },
    {
        "id": 3,
        "chapter_id": 2, # Polynomials & Quadratic Relations
        "name": "Quadratic Formula & Nature of Roots",
        "description": "Using x = (-b +/- sqrt(b^2 - 4ac)) / (2a) and analyzing nature of roots.",
        "prerequisite_concept_id": 2
    },
    {
        "id": 4,
        "chapter_id": 1, # Real Numbers
        "name": "Fundamental Theorem of Arithmetic & HCF/LCM",
        "description": "Prime factorization and HCF * LCM = a * b relationship.",
        "prerequisite_concept_id": None
    },
    {
        "id": 5,
        "chapter_id": 3, # Chemical Reactions & Equations
        "name": "Identifying & Writing Chemical Equations",
        "description": "Reactants, products, chemical symbols, and physical state notations.",
        "prerequisite_concept_id": None
    },
    {
        "id": 6,
        "chapter_id": 3, # Chemical Reactions & Equations
        "name": "Balancing Chemical Equations",
        "description": "Law of conservation of mass and step-by-step coefficient balancing.",
        "prerequisite_concept_id": 5
    },
    {
        "id": 7,
        "chapter_id": 3, # Chemical Reactions & Equations
        "name": "Types of Chemical Reactions & Redox",
        "description": "Combination, decomposition, displacement, and oxidation-reduction.",
        "prerequisite_concept_id": 6
    }
]

LESSONS = [
    {
        "id": 1,
        "concept_id": 1,
        "title": "Introduction to Quadratic Equations in Standard Form",
        "content": "A quadratic equation in variable x is an equation of the form ax^2 + bx + c = 0, where a, b, c are real numbers and a != 0. The standard form orders terms by descending powers of x.",
        "learning_objective": "Identify quadratic equations and express them in standard form.",
        "difficulty_level": "introductory"
    },
    {
        "id": 2,
        "concept_id": 2,
        "title": "Solving Quadratic Equations by Factorisation",
        "content": "To solve ax^2 + bx + c = 0 by factorisation, find two numbers p and q such that p + q = b and p * q = a * c. Rewrite bx as px + qx, group terms, and factor out common expressions.",
        "learning_objective": "Master factorisation of quadratic expressions.",
        "difficulty_level": "standard"
    },
    {
        "id": 3,
        "concept_id": 3,
        "title": "The Quadratic Formula and Nature of Roots",
        "content": "For ax^2 + bx + c = 0, the discriminant D = b^2 - 4ac determines the nature of roots. If D > 0: two distinct real roots. If D = 0: two equal real roots. If D < 0: no real roots.",
        "learning_objective": "Apply the quadratic formula and compute the discriminant.",
        "difficulty_level": "advanced"
    },
    {
        "id": 4,
        "concept_id": 4,
        "title": "Prime Factorization, HCF and LCM Applications",
        "content": "Every composite number can be uniquely factored into primes. For any two positive integers a and b: HCF(a, b) * LCM(a, b) = a * b.",
        "learning_objective": "Calculate HCF and LCM using prime factorization.",
        "difficulty_level": "standard"
    },
    {
        "id": 5,
        "concept_id": 5,
        "title": "Writing Word Reactions into Chemical Formulas",
        "content": "Chemical equations represent reactants on the left and products on the right separated by an arrow. State symbols (s, l, g, aq) specify physical states.",
        "learning_objective": "Convert chemical word statements into balanced skeleton formulas.",
        "difficulty_level": "introductory"
    },
    {
        "id": 6,
        "concept_id": 6,
        "title": "Step-by-Step Balancing of Chemical Equations",
        "content": "According to the Law of Conservation of Mass, the total number of atoms of each element must be equal on both sides of a chemical equation.",
        "learning_objective": "Balance complex chemical equations step by step.",
        "difficulty_level": "standard"
    },
    {
        "id": 7,
        "concept_id": 7,
        "title": "Types of Reactions: Combination, Displacement & Redox",
        "content": "Reactions are categorized by how atoms recombine. Redox reactions involve simultaneous oxidation (loss of electrons / gain of oxygen) and reduction (gain of electrons / loss of oxygen).",
        "learning_objective": "Classify chemical reactions and identify oxidizing/reducing agents.",
        "difficulty_level": "advanced"
    }
]

LESSON_RESOURCES = [
    {
        "id": 1,
        "lesson_id": 2,
        "resource_type": "VIDEO",
        "title": "Factorisation of Quadratic Equations Explained",
        "url": "https://www.youtube.com/watch?v=mock_math_factorisation",
        "access_requirement": "high_speed"
    },
    {
        "id": 2,
        "lesson_id": 2,
        "resource_type": "TEXT",
        "title": "Step-by-Step Guide to Splitting Middle Term",
        "url": "/resources/math_factorisation_guide.pdf",
        "access_requirement": "offline_friendly"
    },
    {
        "id": 3,
        "lesson_id": 6,
        "resource_type": "VIDEO",
        "title": "Balancing Chemical Equations Concept Video",
        "url": "https://www.youtube.com/watch?v=mock_sci_balancing",
        "access_requirement": "high_speed"
    },
    {
        "id": 4,
        "lesson_id": 6,
        "resource_type": "AUDIO",
        "title": "Audio Summary: Principles of Conservation of Mass",
        "url": "/resources/sci_balancing_audio.mp3",
        "access_requirement": "low_bandwidth"
    }
]

STUDENT_CONCEPT_MASTERY = [
    # Student 1 (Aarav Sharma): Strong Math, Weak Science (Balancing Equations)
    {"student_id": 1, "concept_id": 1, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.88, "attempt_count": 8, "correct_count": 7, "sure_count": 7, "guessing_count": 1, "trend": "IMPROVING"},
    {"student_id": 1, "concept_id": 2, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.85, "attempt_count": 6, "correct_count": 5, "sure_count": 5, "guessing_count": 1, "trend": "STABLE"},
    {"student_id": 1, "concept_id": 4, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.82, "attempt_count": 5, "correct_count": 4, "sure_count": 4, "guessing_count": 1, "trend": "STABLE"},
    {"student_id": 1, "concept_id": 5, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.78, "attempt_count": 6, "correct_count": 5, "sure_count": 5, "guessing_count": 1, "trend": "STABLE"},
    {"student_id": 1, "concept_id": 6, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.32, "attempt_count": 6, "correct_count": 2, "sure_count": 1, "guessing_count": 5, "trend": "DECLINING"},

    # Student 2 (Priya Verma): Strong Science, Weak Math (Factorisation)
    {"student_id": 2, "concept_id": 1, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.72, "attempt_count": 5, "correct_count": 4, "sure_count": 4, "guessing_count": 1, "trend": "STABLE"},
    {"student_id": 2, "concept_id": 2, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.34, "attempt_count": 7, "correct_count": 2, "sure_count": 2, "guessing_count": 5, "trend": "DECLINING"},
    {"student_id": 2, "concept_id": 5, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.90, "attempt_count": 8, "correct_count": 8, "sure_count": 8, "guessing_count": 0, "trend": "IMPROVING"},
    {"student_id": 2, "concept_id": 6, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.86, "attempt_count": 6, "correct_count": 5, "sure_count": 5, "guessing_count": 1, "trend": "IMPROVING"},

    # Student 3 (Kabir Roy): High Mastery Across Math & Science
    {"student_id": 3, "concept_id": 1, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.92, "attempt_count": 10, "correct_count": 10, "sure_count": 10, "guessing_count": 0, "trend": "IMPROVING"},
    {"student_id": 3, "concept_id": 2, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.88, "attempt_count": 8, "correct_count": 7, "sure_count": 7, "guessing_count": 1, "trend": "IMPROVING"},
    {"student_id": 3, "concept_id": 3, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.90, "attempt_count": 8, "correct_count": 8, "sure_count": 8, "guessing_count": 0, "trend": "IMPROVING"},
    {"student_id": 3, "concept_id": 4, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.86, "attempt_count": 7, "correct_count": 6, "sure_count": 6, "guessing_count": 1, "trend": "STABLE"},
    {"student_id": 3, "concept_id": 5, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.89, "attempt_count": 7, "correct_count": 6, "sure_count": 6, "guessing_count": 1, "trend": "STABLE"},
    {"student_id": 3, "concept_id": 6, "p_l0": 0.20, "p_t": 0.15, "p_g": 0.20, "p_s": 0.10, "mastery_probability": 0.85, "attempt_count": 6, "correct_count": 5, "sure_count": 5, "guessing_count": 1, "trend": "STABLE"}
]


