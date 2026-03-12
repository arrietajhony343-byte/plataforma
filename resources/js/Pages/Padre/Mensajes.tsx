import MessageCenter, { MessagePageProps } from '@/Components/Messages/MessageCenter';
import { padreMenuItems } from '@/Config/padreMenu';

export default function Mensajes(props: MessagePageProps) {
    return (
        <MessageCenter
            {...props}
            basePath="/padre/mensajes"
            menuItems={padreMenuItems}
            pageTitle="Mensajes"
            headerTitle="Mensajes"
            headerDescription="Habla con docentes y administración del colegio desde una mensajería oficial y segura."
        />
    );
}
