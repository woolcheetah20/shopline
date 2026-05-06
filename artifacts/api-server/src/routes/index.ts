import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import shopsRouter from "./shops";
import productsRouter from "./products";
import ordersRouter from "./orders";
import driversRouter from "./drivers";
import deliveriesRouter from "./deliveries";
import statsRouter from "./stats";
import uploadRouter from "./upload";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(shopsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(driversRouter);
router.use(deliveriesRouter);
router.use(statsRouter);
router.use(uploadRouter);
router.use(adminRouter);

export default router;
