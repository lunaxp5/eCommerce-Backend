import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "E-Commerce Backend API",
    description: "API documentation for the E-Commerce Backend",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/bootstrap.js"];
swaggerAutogen()(outputFile, endpointsFiles, doc);
