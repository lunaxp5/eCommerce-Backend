import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const router = Router();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce Backend API",
      version: "1.0.0",
      description: "API documentation for the E-Commerce Backend",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
      },
    ],
  },
  apis: ["./src/modules/**/*.js"], // Archivos donde se encuentran las rutas y controladores
};

const specs = swaggerJsdoc(options);

router.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

export default router;
