# HelpWise

HelpWise is a platform designed to connect individuals who need help with those willing to provide it. It facilitates community support through a secure and efficient request-and-bid system.

## Features

- **User Authentication**: Secure signup and login.
- **Help Requests**: Users can post requests for various types of help.
- **Bidding System**: Helpers can bid on requests.
- **Real-time Chat**: Integrated chat for communication between requesters and helpers.
- **AI Integration**:
    - **Gemini**: Enhances help request descriptions.
    - **OpenAI**: Analyzes risks and suggests prevention measures.
- **Payments**: Secure payments via Stripe.
- **Notifications**: Real-time updates.

## Tech Stack

### Frontend
- **React** (Vite)
- **Material UI** (MUI) for styling
- **Socket.io-client** for real-time communication
- **Stripe.js** for payments
- **Axios** for API requests

### Backend
- **Node.js** & **Express**
- **MongoDB** (Mongoose) for database
- **Socket.io** for real-time features
- **JWT** for authentication
- **Google Generative AI** (Gemini)
- **OpenAI API**
- **Stripe API**

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd HelpWise
   ```

2. **Backend Setup:**
   ```bash
   cd Backend
   npm install
   ```
   
   Create a `.env` file in the `Backend` directory with the following variables:
   ```env
   PORT=9001
   MONGO_URI=mongodb://localhost:27017/helpwise # Or your MongoDB Atlas URI
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

   Start the backend server:
   ```bash
   npm start
   # OR
   npx nodemon index.js
   ```

3. **Frontend Setup:**
   ```bash
   cd ../Frontend
   npm install
   ```

   Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Ensure the Backend is running on port `9001` (or your configured port).
2. Open the Frontend in your browser (usually `http://localhost:5173`).
3. Register a new account or log in.
4. Post a help request or browse existing requests to offer help.

## License

This project is licensed under the ISC License.
