import MessageCenter, { MessagePageProps } from '@/Components/Messages/MessageCenter';
import { adminMenuItems } from '@/Config/adminMenu';

export default function Mensajes(props: MessagePageProps) {
    return (
        <MessageCenter
            {...props}
            basePath="/admin/mensajes"
            menuItems={adminMenuItems}
            pageTitle="Mensajes"
            headerTitle="Mensajes Institucionales"
            headerDescription="Gestiona conversaciones con estudiantes, padres, docentes y administración desde un único centro de mensajes."
        />
    );
}
