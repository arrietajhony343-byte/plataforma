import MessageCenter, { MessagePageProps } from '@/Components/Messages/MessageCenter';
import { profesorMenuItems } from '@/Config/profesorMenu';

export default function Mensajes(props: MessagePageProps) {
    return (
        <MessageCenter
            {...props}
            basePath="/profesor/mensajes"
            menuItems={profesorMenuItems}
            pageTitle="Mensajes"
            headerTitle="Mensajes"
            headerDescription="Comunícate con estudiantes, acudientes y administración desde un solo centro de conversación."
        />
    );
}
