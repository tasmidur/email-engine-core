import {NextFunction, Request, Response, Router} from 'express';
import {MessageService} from "../services/MessageService";
import {responseMessage} from "../utils/helpers";
import {MailBoxService} from "../services/MailBoxService";
import {SessionMiddleware} from "../middleware/SessionMiddleware";

const router = Router();
const messageService = new MessageService();
const mailBoxService = new MailBoxService();

router.get('/', SessionMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            size,
            from
        } = req.query;
        const response = await messageService.getMessages({
            size: parseInt(size as string),
            from: parseInt(from as string),
            userId: (req as any)?.user?.id
        });
        return res.json(responseMessage(200, "Messages", response.data));
    } catch (error: any) {
        console.log("error", error);
        next(error);
    }
});
router.get('/mailbox', SessionMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await mailBoxService.getMailBoxDetails({
            userId: (req as any)?.user?.id
        });
        return res.json(response);
    } catch (error: any) {
        console.log("error", error);
        next(error);
    }
});

export default router;
