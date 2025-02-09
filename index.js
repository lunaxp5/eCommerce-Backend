import express from "express";
import { dbConnection } from "./Database/dbConnection.js";
import { bootstrap } from "./src/bootstrap.js";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { createOnlineOrder } from "./src/modules/order/order.controller.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

import specs from "./swagger-docs.js";

dotenv.config();
const app = express();
app.use(cors());

const port = 3000;
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  createOnlineOrder
);
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("uploads"));

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.resolve("./swagger-output.json"), "utf-8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

bootstrap(app);
dbConnection();

app.listen(process.env.PORT || port, () =>
  console.log(`Example app listening on port ${port}!`)
);
