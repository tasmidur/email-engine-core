import {Request, Response, Router} from 'express';
import {MessageService} from "../services/MessageService";
import {Message} from "../models/Message";
import {OutlookOAuthProvider} from "../providers/OutlookOAuthProvider";

const router = Router();
const messageService = new MessageService();
const outlookOAuthProvider = new OutlookOAuthProvider();
router.post('/create', async (req: Request, res: Response) => {
    const body = req.body;
    let messageType = outlookOAuthProvider.getMessageType(body);
    const message: Message = {
        messageId: body.id,
        userId: "111",
        subject: body.subject,
        bodyPreview: body.bodyPreview,
        parentFolderId: body.parentFolderId,
        conversationId: body.conversationId,
        body: body.body,
        isRead: body.isRead,
        isDraft: body.isDraft,
        messageType: messageType||"new",
        sender: {
            email: body.sender.emailAddress.address,
            name: body.sender.emailAddress.name
        },
        receiver: {
            email: body.toRecipients[0].emailAddress.address,
            name: body.toRecipients[0].emailAddress.name
        },
        createAt: new Date(),
    }
    const response = await messageService.createMessage(message);
    return res.json(response);
});


router.post('/create-bulk', async (req: Request, res: Response) => {
    const body = req.body;
    const response = await messageService.syncMessages(body);
    return res.json(response);
});

export default router;
