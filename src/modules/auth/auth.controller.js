import { userModel } from "../../../Database/models/user.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer"; // Import nodemailer for sending emails

const signUp = catchAsyncError(async (req, res, next) => {
  /* #swagger.tags = ['Auth']
     #swagger.description = 'Endpoint to sign up a user'
     #swagger.parameters['user'] = {
          in: 'body',
          description: 'User information for sign up',
          required: true,
          schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'johndoe@example.com' },
                  password: { type: 'string', example: 'password123' }
              }
          }
      }
     #swagger.responses[201] = {
          description: 'User created successfully'
      }
     #swagger.responses[400] = {
          description: 'Bad request'
      }
     #swagger.responses[409] = {
          description: 'Account already exists'
      }
  */

  let isUserExist = await userModel.findOne({ email: req.body.email });
  if (isUserExist) {
    return next(new AppError("Account is already exist!", 409));
  }
  const user = new userModel(req.body);
  await user.save();

  let token = jwt.sign(
    { email: user.email, name: user.name, id: user._id, role: user.role },
    "JR"
  );
  res.status(201).json({ message: "success", user, token });
});

const signIn = catchAsyncError(async (req, res, next) => {
  /* #swagger.tags = ['Auth']
     #swagger.description = 'Endpoint to sign in a user'
     #swagger.parameters['user'] = {
          in: 'body',
          description: 'User information for sign in',
          required: true,
          schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                  email: { type: 'string', example: 'johndoe@example.com' },
                  password: { type: 'string', example: 'password123' }
              }
          }
      }
     #swagger.responses[200] = {
          description: 'User signed in successfully'
      }
     #swagger.responses[400] = {
          description: 'Bad request'
      }
     #swagger.responses[401] = {
          description: 'Unauthorized'
      }
  */

  const { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return next(new AppError("Invalid email or password", 401));
  }
  let token = jwt.sign(
    { email: user.email, name: user.name, id: user._id, role: user.role },
    "JR"
  );
  res.status(201).json({ message: "success", token, user });
});

const protectedRoutes = catchAsyncError(async (req, res, next) => {
  console.log(req.headers);

  const { token } = req.headers;
  if (!token) return next(new AppError("Token was not provided!", 401));

  let decoded = await jwt.verify(token, "JR");

  // console.log(decoded);
  // console.log(decoded.iat);

  let user = await userModel.findById(decoded.id);
  if (!user) return next(new AppError("Invalid user", 404));
  // console.log(user);
  // console.log(user.passwordChangedAt);

  if (user.passwordChangedAt) {
    let passwordChangedAt = parseInt(user.passwordChangedAt.getTime() / 1000);
    if (passwordChangedAt > decoded.iat)
      return next(new AppError("Invalid token", 401));
  }
  // console.log(decoded.iat, "-------------->",passwordChangedAt);

  req.user = user;
  next();
});

const allowedTo = (...roles) => {
  return catchAsyncError(async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `You are not authorized to access this route. Your are ${req.user.role}`,
          401
        )
      );
    next();
  });
};

const forgotPassword = catchAsyncError(async (req, res, next) => {
  /* #swagger.tags = ['Auth']
     #swagger.description = 'Endpoint to request a password reset token'
     #swagger.parameters['email'] = {
          in: 'body',
          description: 'Email of the user requesting password reset',
          required: true,
          schema: {
              type: 'object',
              required: ['email'],
              properties: {
                  email: { type: 'string', example: 'johndoe@example.com' }
              }
          }
      }
     #swagger.responses[200] = {
          description: 'Password reset token sent successfully'
      }
     #swagger.responses[404] = {
          description: 'Email not found'
      }
  */

  const { email } = req.body;

  // Check if the email exists in the database
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new AppError("Email not found", 404));
  }

  // Generate a JWT token with a 1-hour expiration
  const token = jwt.sign({ email: user.email, id: user._id }, "JR", {
    expiresIn: "1h",
  });

  // Configure nodemailer to send the email
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use your email service provider
    auth: {
      user: "your-email@example.com", // Replace with your email
      pass: "your-email-password", // Replace with your email password or app password
    },
  });

  const mailOptions = {
    from: "your-email@example.com", // Replace with your email
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Use the following token to reset your password: ${token}`,
  };

  // Send the email
  await transporter.sendMail(mailOptions);

  res.status(200).json({
    message: "Password reset token sent successfully",
    token, // Optionally include the token in the response for testing purposes
  });
});

export { signUp, signIn, protectedRoutes, allowedTo, forgotPassword };
