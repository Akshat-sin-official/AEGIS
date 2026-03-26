
A Minor Project Synopsis
On
Password Encryption & Authentication System
Submitted in partial fulfillment of the requirements for the award of the degree of
BACHELOR OF TECHNOLOGY
Session 2025-26
in
Computer Science and Engineering
By ----
Under the guidance of ---
SCHOOL OF COMPUTER SCIENCE AND ENGINEERING
IILM UNIVERSITY, GREATER NOIDA, INDIA
March, 2026
 
SCHOOL OF COMPUTER SCIENCE AND ENGINEERING
IILM UNIVERSITY, GREATER NOIDA
Index
Section No.	Section	Page No.
1	Introduction	
2	Problem Statement	
3	Objectives	
4	Methodology	
5	Tools & Technologies	
6	Expected Outcomes	
7	Applications	
8	Conclusion	

Signature of Supervisor: _____________________
Date: ________________________________
 
1. Introduction
In the modern era of digital communication and online services, securing user credentials has become a critical concern. Password-based authentication remains the most widely used mechanism for verifying user identity across web and mobile applications. However, improper password storage and weak authentication flows expose systems to severe risks such as data breaches, credential stuffing, and unauthorized access.

This project presents the design and implementation of a Password Encryption & Authentication System that leverages the bcrypt adaptive hashing algorithm to ensure passwords are never stored in plain text. By integrating risk-based multi-factor authentication (MFA), session management, and a comprehensive audit log, the system addresses multiple security layers following industry best practices.

Developed as part of the B.Tech CSE minor project curriculum at IILM University, this system provides students with hands-on experience in application security, cryptographic algorithms, and secure software design patterns.
2. Problem Statement
Many real-world applications continue to store user passwords in plain text or using weak reversible encoding, making them extremely vulnerable to database breaches. Even when hashing is used, older algorithms like MD5 without salting can be broken by precomputed rainbow tables or brute-force attacks. The core problems addressed by this project are:
•	Passwords stored in plain text or reversible encoding are immediately exposed in a data breach.
•	Authentication systems without brute-force protection are vulnerable to credential stuffing and dictionary attacks.
•	Static single-factor authentication does not account for contextual risk such as a login attempt from a new device or unknown IP address.
•	Lack of session expiry and secure cookie policies leave users exposed to session hijacking.
•	Absence of security audit logs makes it difficult to detect or investigate intrusion attempts.
3. Objectives
The primary objectives of this project are:
•	Implement secure password storage using the bcrypt adaptive hashing algorithm with dynamic salting, providing strong resistance against brute-force and rainbow-table attacks.
•	Build a complete user registration and authentication flow with mandatory password strength validation and zero plain-text storage.
•	Integrate a risk-based second-factor authentication (TOTP or email OTP) triggered when login context changes, such as a new IP address or unrecognized device.
•	Enforce account lockout after 3 failed attempts (10-minute lock) and IP blocking after 5 failed attempts, with automated security notification emails.
•	Implement secure session management using HTTP-only cookies with automatic inactivity-based expiry.
•	Maintain a read-only, tamper-resistant audit log of all authentication events including timestamp, IP address, device identifier, and result.
•	Deliver average login response time under 200 ms (excluding OTP delivery) to ensure a seamless user experience.
4. Methodology
The project follows a structured development methodology comprising six phases:

Phase 1 – Requirement Analysis
Review of OWASP authentication guidelines, identification of common password security vulnerabilities, and specification of both functional and non-functional requirements as documented in the PRD.
Phase 2 – System Design
Design of the database schema (Users table with email, password hash, failed attempt count, lock status, and TOTP flag; Authentication Logs table), system architecture, and definition of API endpoints for registration, login, session management, and notifications.
Phase 3 – Implementation
Development of the backend authentication module. Integration of the Bcrypt library for password hashing and verification. Implementation of the login context evaluation engine that determines whether additional authentication factors are required.
Phase 4 – Security Integration
Integration of CSRF protection, HTTP-only cookie session handling, account lockout logic, IP-based rate limiting, and automated security email notifications via SMTP2GO.
Phase 5 – Testing & Validation
Unit testing of individual components, integration testing of the full authentication flow, security testing for brute-force and session hijacking scenarios, and performance benchmarking to validate the sub-200 ms response time requirement.
Phase 6 – Documentation & Reporting
Preparation of project documentation, synopsis, and final report in accordance with university guidelines.
5. Tools & Technologies
Category	Tools / Technologies
Programming Language	Python / Node.js (JavaScript)
Hashing Algorithm	Bcrypt
MFA / OTP	TOTP (Google Authenticator), Email OTP
Database	MySQL
Session Management	HTTP-only Cookies, Express-Session
Security	CSRF Protection (helmet / csurf)
Email Notifications	SMTP2GO
Version Control	Git & GitHub
Testing	Jest / PyTest, Postman
IDE	Visual Studio Code
6. Expected Outcomes
•	A fully functional registration and login system where passwords are stored exclusively as bcrypt hashes, never in plain text.
•	A risk-aware authentication engine that triggers MFA only upon detecting a contextual anomaly, reducing friction for trusted users.
•	An effective brute-force protection mechanism with account lockout, IP blocking, and automated security notifications.
•	Secure session management using HTTP-only cookies with automatic expiry on inactivity.
•	A tamper-proof, read-only audit trail recording every authentication event for security analysis and compliance.
•	Login response times consistently below 200 ms under standard load conditions.
7. Applications
•	Web Applications: Authentication backbone for e-commerce portals, banking systems, healthcare platforms, and social media services.
•	Enterprise Software: Corporate intranet and ERP systems requiring strong access control and compliance audit trails.
•	Educational Platforms: E-learning portals and university management systems securing student and faculty accounts.
•	Government Digital Services: Citizen portals requiring multi-layered authentication for sensitive operations.
•	Mobile Applications: Backend authentication APIs consumable by iOS and Android clients.
•	Security Research & Education: Reference implementation for academic study of cryptographic authentication and password security best practices.
8. Conclusion
Password security is a foundational pillar of application security, and yet it remains one of the most frequently mishandled aspects of software development. This project addresses that gap by implementing a comprehensive, industry-aligned Password Encryption & Authentication System combining adaptive cryptographic hashing (bcrypt), risk-based multi-factor authentication, brute-force protection, and secure session management.

By following the methodology outlined in this synopsis and adhering to the requirements specified in the Product Requirements Document, the project aims to deliver a production-ready authentication module that demonstrates practical engineering competence in cybersecurity and secure software design.

The system reinforces the importance of cryptographic principles, threat-aware design, and secure coding practices — equipping students with skills directly applicable in industry and making a meaningful contribution to the academic study of application security.

Signature of Supervisor: _____________________
Date: ________________________________
