# CourseHub: Course Search App

React frontend and Spring Boot backend (Spring Security + JWT + MySQL).

```
CourseSearch_App/
├── src/        Spring Boot 4 backend (Java 21, Spring Security + JWT, MySQL)
├── pom.xml
├── mvnw        Maven wrapper (no need to install Maven)
└── frontend/   React 18 + Vite
```

The app starts with **no courses**. Providers add them.

## How people use it

**Learners** sign up with a full name, email and password on `/register`, and sign in with their email and password on `/login`. They can search and filter courses and click "Apply Now" to open a provider's site. They cannot change anything.

**Providers** use a separate page (`/provider`, "Register as Provider" in the header):

1. Enter the **access code** (set in `application.properties`, default `PROVIDER-2026`).
2. Then sign in, or create a provider account (full name, email, organization name and password).

After signing up (or signing in with missing details), a provider is taken to a **company details** page: mobile number, company website link and an optional logo. These appear on every course card: the logo in the card header, the number as a call link, and "Apply Now" opens the website in a new tab. Providers can change them later in Settings, then Company profile.

The server checks the access code on every provider sign in and sign up, so skipping the first screen in the browser does not help. Learner accounts are turned away from the provider page, and provider accounts are turned away from the learner page.

**Admin** signs in on the provider page too (with the access code), using the email and password from `application.properties` (default `admin@coursehub.example` / `admin12345`). The admin account is the only account created automatically, and no course data is created.

## Pages

| Page | Who | What it is |
|------|-----|------------|
| `/` Home | everyone | Banner page. Clicking the CourseHub logo always comes here. Has a search box that opens the course search. |
| `/login`, `/register` | signed-out learners | Learner sign in and sign up (name, email, password) |
| `/provider` | signed-out providers | Access code first, then sign in or sign up |
| `/courses` | any signed-in role | Course search, with a slim navigation bar on the left |
| `/provider/profile` | providers | Mobile number, company website, logo |
| `/settings` | any signed-in role | Light mode or Dark mode, account details |

After signing in, the name at the top right opens a menu with **Settings** and **Logout**. In Settings, choose **Light mode** or **Dark mode**. The choice is remembered on that device. On the first visit it follows the device's own setting.

## How search works

Results update as you type, and the letters you typed are highlighted in the results.

- The text is split into words, and every word must be found in the title, provider, category, skills, city or description.
- A word of 1 or 2 letters must be the start of a word, so `ja` finds Java and Jaipur but not Bangalore.
- A word of 3 or more letters can be found anywhere, so `script` finds JavaScript.
- Sort By "Best match" (the default while searching) puts courses whose title starts with the first word at the top.

## Who can do what

| Action                                   | Learner | Provider            | Admin |
|------------------------------------------|:-------:|:-------------------:|:-----:|
| Search, filter and view courses          |   yes   |         yes         |  yes  |
| Add a course                             |   no    |         yes         |  yes  |
| Edit or delete a course                  |   no    | their own courses   | their own courses |

Rules are enforced on the server (`security/SecurityConfig.java` and `controller/CourseController.java`, under `src/main/java/com/example/CourseSearch_App/`). The React app also hides buttons a person cannot use.

## Course fields

Title, provider or organization name, category, skills (comma separated), location (city), work mode (Online, Offline, Hybrid), type (Paid or Free), fees in rupees (paid courses only), duration in months, apply-by date, description and an optional apply link.

The course form also holds the provider's company logo, mobile number and company website. They are saved on the company profile, so they appear on all of that provider's courses. A new logo is uploaded when the course is saved.

Search looks at title, provider, category, skills and description. The filters are Skills, Categories, Sort By, City, Course Type (Paid or Free) and Course Mode. The dropdown choices for Skills, Categories and City are built from the courses that exist.

The website link must start with `http://` or `https://` (the form adds `https://` if it is left out). The card shows "Apply Now", which opens the course's apply link (or the provider's company website) in a new tab. After the apply-by date the card shows "Applications closed".

## Run it

### 1. Backend

1. Install Java 21 and MySQL (the Maven wrapper is included, so Maven is not needed).
2. Make sure MySQL is running. Open `src/main/resources/application.properties` and set your MySQL password
   (or set the `DB_PASSWORD` environment variable). Optionally change the access code and the admin login.
3. Start it from the project root:

```bash
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

It runs on http://localhost:8080 and creates the `coursehub` database and tables on first start.

Note: `mvn package` also runs the bundled `contextLoads` test, which needs MySQL running.
Use `./mvnw package -DskipTests` to build without it.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` calls to port 8080.

## Settings (`application.properties`)

Every value can also be set with an environment variable: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
`JWT_SECRET`, `PROVIDER_ACCESS_CODE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN`.

| Setting                      | What it does                                                    |
|------------------------------|-----------------------------------------------------------------|
| `app.provider.access-code`   | Code providers must enter before signing in or registering      |
| `app.admin.email/password`   | Admin account created on first start (empty password = skip it) |
| `app.jwt.secret`             | Signs login tokens (32+ characters)                             |
| `app.cors.allowed-origin`    | Address of the React app                                        |

## API

| Method | Path                                           | Who                         |
|--------|------------------------------------------------|-----------------------------|
| POST   | `/api/auth/register`, `/api/auth/login`        | learners                    |
| POST   | `/api/auth/provider/verify-code`               | anyone with the code        |
| POST   | `/api/auth/provider/register`, `.../login`     | providers (code required)   |
| GET    | `/api/courses?q=&skill=&category=&city=&type=&mode=&sortBy=&page=&size=` | any signed-in role |
| GET    | `/api/courses/filters`                         | any signed-in role          |
| GET    | `/api/provider/profile`                        | provider                    |
| PUT    | `/api/provider/profile`                        | provider (mobile, website, organization) |
| POST   | `/api/provider/logo` (multipart `file`)        | provider (PNG, JPG or WebP, under 1 MB) |
| DELETE | `/api/provider/logo`                           | provider                    |
| GET    | `/api/logos/{userId}`                          | public (so images can load) |
| POST   | `/api/courses`                                 | provider, admin             |
| PUT    | `/api/courses/{id}`                            | the provider who added it   |
| DELETE | `/api/courses/{id}`                            | the provider who added it   |

`type` is `PAID` or `FREE`. `mode` is `ONLINE`, `OFFLINE` or `HYBRID`. `sortBy` is `relevance`, `newest`, `oldest`, `title_asc`, `title_desc`, `duration_asc` or `duration_desc`.

## Before going live

- A provider's mobile number is shown to every signed-in learner on their courses. The company details page says so.
- Logos are checked by their file contents (SVG is refused because it can carry scripts) and are public by design.
- Passwords need at least 8 characters. Emails are stored in lower case and are the sign-in name.
- Provider emails are never sent to learners: the course list only tells the app whether a course can be edited by the signed-in person.
- Change the access code, the admin password and `app.jwt.secret`, and keep them out of version control (use the environment variables above).
- Replace the placeholder email in `frontend/src/components/Footer.jsx`.
- The access code has no limit on wrong guesses. For a public site, add rate limiting.
- Serve the site over HTTPS and set `app.cors.allowed-origin` to the real address.
- The login token is kept in `localStorage`. That is fine for a project like this, but a production app may prefer an HttpOnly cookie.
