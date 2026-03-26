Product Requirements Document (PRD) 
Project Title: Password Encryption & Authentication System 
Program: B.Tech CSE  
Instructor: Shivam Awasthi 
1. Purpose 
To design and implement a secure, reliable, and performant user authentication system 
that follows industry-accepted password security practices and enforces risk-based access 
control. 
The system ensures safe password storage, prevents brute-force attacks, and applies 
multi-factor authentication only when required. 
2. Scope 
In Scope 
● Secure password storage using adaptive hashing 
● User authentication (login/logout) 
● Risk-based second factor authentication 
● Failed login handling and abuse prevention 
● Session management 
● Security logging and audit trail 
Out of Scope 
● Role-based access control 
● Full intrusion detection system 
● Biometric authentication 
● External identity providers (OAuth, SSO) 
3. Functional Requirements 
3.1 User Registration 
● System shall accept email and password 
● Password strength validation is mandatory 
● Passwords shall be stored only as hashed values 
● No plaintext or reversible passwords stored 
3.2 User Login 
● System shall authenticate users using email and password 
● Password verification shall use bcrypt hash comparison 
● Login behavior depends on login context 
Login Context Rules 
● Same IP and known device → password only 
● Different IP or new device: 
○ If TOTP enabled → require TOTP 
○ Else → require email OTP 
3.3 Failed Login Handling 
● After 3 consecutive failed attempts: 
○ User account is locked for 10 minutes 
● After 5 consecutive failed attempts: 
○ Source IP is temporarily blocked 
○ Security notification email is sent to user 
○ User instructed to contact administrator for authorization 
3.4 Session Management 
● System shall create a secure authenticated session on login 
● Sessions must use HTTP-only cookies 
● Sessions must expire after inactivity or logout 
3.5 Notifications 
● System shall send email alerts for: 
○ Account lock events 
○ IP block events 
○ Suspicious login attempts 
3.6 Logging & Audit 
● All authentication attempts shall be logged 
● Logs shall include timestamp, IP address, device identifier, and result 
● Logs are read-only and auditable 
4. Non-Functional Requirements 
Security 
● Password hashing using bcrypt 
● Protection against brute force attacks 
● No sensitive information in error messages 
● CSRF protection enabled 
Performance 
● Average login response time < 200 ms (excluding OTP) 
● Authentication checks must be non-blocking 
Reliability 
● Account lock and IP block rules must be consistently enforced 
● System must handle concurrent login attempts safely 
Usability 
● Simple login flow for low-risk scenarios 
● Additional steps only when risk is detected 
● Clear and minimal error messages 
5. Data Requirements 
Users 
● Email 
● Password hash 
● Failed attempt count 
● Lock status 
● TOTP enabled flag 
Authentication Logs 
● User identifier 
● IP address 
● Device identifier 
● Timestamp 
● Success or failure 