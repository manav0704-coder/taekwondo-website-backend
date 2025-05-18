<<<<<<< HEAD
# Maharashtra Taekwondo Federation Backend API

This is the backend API for the Maharashtra Taekwondo Federation website built with Node.js, Express, and MongoDB.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- express-rate-limit for rate limiting
- Helmet.js for secure HTTP headers
- CORS protection

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- MongoDB (local or MongoDB Atlas account)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd taekwondo-website/server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment variables by creating a `.env` file in the root of the server directory (see Environment Variables section below)
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root of the server directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/taekwondo
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=30d
NODE_ENV=development
```

## Available Scripts

- `npm start` - Runs the app in production mode
- `npm run dev` - Runs the app with nodemon for development

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user (Admin or owner)
- `POST /api/users` - Create a user (Admin only)
- `PUT /api/users/:id` - Update user (Admin or owner)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PUT /api/users/updatepassword` - Update own password

### Events
- `GET /api/events` - Get all events
- `GET /api/events/upcoming` - Get upcoming events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create an event (Admin/Instructor)
- `PUT /api/events/:id` - Update an event (Admin/Instructor)
- `DELETE /api/events/:id` - Delete an event (Admin/Instructor)

### Gallery
- `GET /api/gallery` - Get all gallery items
- `GET /api/gallery/category/:category` - Get gallery items by category
- `GET /api/gallery/:id` - Get single gallery item
- `POST /api/gallery` - Create gallery item (Admin/Instructor)
- `PUT /api/gallery/:id` - Update gallery item (Admin/Instructor)
- `DELETE /api/gallery/:id` - Delete gallery item (Admin/Instructor)

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contact submissions (Admin only)
- `GET /api/contact/:id` - Get single contact submission (Admin only)
- `PUT /api/contact/:id` - Update contact status (Admin only)
- `DELETE /api/contact/:id` - Delete contact submission (Admin only)

## Database Models

- User - User accounts including admin/instructor roles
- Event - Taekwondo events, tournaments, and classes
- Gallery - Photos and videos for the gallery
- Contact - Contact form submissions
- Testimonial - Student and parent testimonials

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Rate limiting for API endpoints
- Secure HTTP headers with Helmet.js
- CORS protection
- Input validation and sanitization
- MongoDB query protection

## Deployment

This API is designed to be deployed to platforms like Render, Railway, Heroku, or any other Node.js hosting service.

## Learn More

For more information about the technologies used, check out:

- [Node.js documentation](https://nodejs.org/)
- [Express.js documentation](https://expressjs.com/)
- [MongoDB documentation](https://docs.mongodb.com/)
- [Mongoose documentation](https://mongoosejs.com/) 
=======
# taekwondo-website-backend
>>>>>>> 5edbbb9bd290aa57c159eb7c237a0e44d240398c
