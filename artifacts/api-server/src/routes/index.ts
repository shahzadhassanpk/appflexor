import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dialerRouter from "./dialer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dialerRouter);

export default router;
