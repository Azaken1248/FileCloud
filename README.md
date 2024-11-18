# File Cloud Project

## Description

The **File Cloud Project** is a modern web application designed to allow users to securely store and access their files from anywhere. It features user authentication (signup and login) powered by JSON Web Tokens (JWT), a live-searchable file display interface, and file upload functionality. The frontend is built using ReactJS and TailwindCSS, while the backend utilizes ExpressJS, AWS DynamoDB, and AWS S3. 

The backend is deployed on AWS Lambda with an additional fallback server endpoint hosted on a personal server, ensuring reliable availability. The project follows a classic client-server architecture, making it easy to understand and extend.

---

## Features

1. **User Authentication**:
   - Secure login and signup functionality using JWT-based authentication.

2. **File Display and Search**:
   - Displays a list of files stored in the cloud.
   - Features a live-search box to filter and find files instantly.

3. **File Upload**:
   - Upload files to the cloud securely using AWS S3 storage.

4. **Backend Reliability**:
   - Primary backend deployed on AWS Lambda.
   - Fallback endpoint hosted on a personal server for backup.

5. **Frontend**:
   - Built with ReactJS and styled with TailwindCSS for a modern, responsive design.
   - Deployed on **Vercel** for a fast and seamless experience.

6. **Backend**:
   - Node.js/ExpressJS for API development.
   - AWS DynamoDB for managing metadata.
   - AWS S3 for file storage.

---

## Directory Structure

```
root
 ┣ client
 ┃  ┣ dist
 ┃  ┃  ┣ assets
 ┃  ┃  ┃  ┣ index-C_IEStdK.css
 ┃  ┃  ┃  ┗ index-CggijX_O.js
 ┃  ┃  ┣ index.html
 ┃  ┃  ┗ vite.svg
 ┃  ┣ node_modules
 ┃  ┃  ┗ .package-lock.json
 ┃  ┣ public
 ┃  ┃  ┗ vite.svg
 ┃  ┣ src
 ┃  ┃  ┣ assets
 ┃  ┃  ┃  ┣ favicon.png
 ┃  ┃  ┃  ┗ react.svg
 ┃  ┃  ┣ components
 ┃  ┃  ┃  ┣ FileCard.jsx
 ┃  ┃  ┃  ┣ Loader.jsx
 ┃  ┃  ┃  ┣ Navbar.jsx
 ┃  ┃  ┃  ┣ SearchBar.jsx
 ┃  ┃  ┃  ┣ Sidebar.jsx
 ┃  ┃  ┃  ┗ UploadFiles.jsx
 ┃  ┃  ┣ router
 ┃  ┃  ┃  ┗ PrivateRoute.jsx
 ┃  ┃  ┣ screens
 ┃  ┃  ┃  ┣ AuthPage.jsx
 ┃  ┃  ┃  ┗ Dashboard.jsx
 ┃  ┃  ┣ styles
 ┃  ┃  ┃  ┗ Loader.css
 ┃  ┃  ┣ App.css
 ┃  ┃  ┣ App.jsx
 ┃  ┃  ┣ index.css
 ┃  ┃  ┗ main.jsx
 ┃  ┣ .gitignore
 ┃  ┣ eslint.config.js
 ┃  ┣ index.html
 ┃  ┣ package-lock.json
 ┃  ┣ package.json
 ┃  ┣ postcss.config.js
 ┃  ┣ README.md
 ┃  ┣ tailwind.config.js
 ┃  ┣ vercel.json
 ┃  ┗ vite.config.js
 ┗ server
    ┣ node_modules
    ┃  ┗ .package-lock.json
    ┣ src
    ┃  ┣ .env
    ┃  ┗ app.js
    ┣ .gitignore
    ┣ package-lock.json
    ┗ package.json
```

---

## Environment Variables

The `.env` file should have the following format:

```
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
JWT_SECRET=your-jwt-secret
S3_BUCKET_NAME=your-s3-bucket-name
PORT=your-backend-port
```

---

## Steps to Run the Project Globally

### Prerequisites
- Node.js and npm installed on your system.
- AWS account and credentials for S3 and DynamoDB setup.
- `.env` file with the required environment variables.
- Vercel account for deploying the frontend (optional).

---

### Frontend (Client)

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app in your browser at:
   ```
   http://localhost:5173
   ```

---

### Backend (Server)

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server locally:
   ```bash
   npm start
   ```
4. The backend will be available at:
   ```
   http://localhost:PORT
   ```

---

### Deployments

#### Frontend
1. Deploy the frontend on Vercel:
   - Connect your GitHub repository to Vercel.
   - Deploy the `client` folder directly.
   - Configure environment variables in the Vercel dashboard.

#### Backend
1. Deploy on AWS Lambda:
   - Package your backend code and dependencies in a `.zip` file.
   - Upload the file to an AWS Lambda function.
   - Configure the API Gateway for HTTPS access.
   - Ensure your Lambda has access to your S3 and DynamoDB resources.

2. Set up a fallback server:
   - Host your backend code on a personal server (e.g., using an Express app with PM2).
   - Update the frontend to handle fallback requests automatically.

---

## Usage

1. Sign up and log in to access your account.
2. Upload files using the **Upload** button.
3. View your files in the live-searchable file display.
4. Search for specific files in the search bar.

---

## Technology Stack

- **Frontend**: ReactJS, TailwindCSS, Vercel.
- **Backend**: ExpressJS, AWS Lambda, DynamoDB, S3.
- **Database**: AWS DynamoDB (metadata).
- **Storage**: AWS S3.
- **Authentication**: JSON Web Tokens (JWT).

---
