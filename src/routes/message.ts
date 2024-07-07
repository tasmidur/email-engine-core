import {Request, Response, Router} from 'express';
import {MessageService} from "../services/MessageService";
import {SessionMiddleware} from "../middleware/SessionMiddleWare";
import {responseMessage} from "../utils/helpers";

const router = Router();
const messageService = new MessageService();

router.get('/', SessionMiddleware, async (req: Request, res: Response) => {
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
});

export default router;
