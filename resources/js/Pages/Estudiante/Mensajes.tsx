import MessageCenter, { MessagePageProps } from '@/Components/Messages/MessageCenter';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

export default function Mensajes(props: MessagePageProps) {
    return (
        <MessageCenter
            {...props}
            basePath="/estudiante/mensajes"
            menuItems={estudianteMenuItems}
            pageTitle="Mensajes"
            headerTitle="Mensajes"
            headerDescription="Comunícate con docentes, acudientes y administración dentro de la plataforma."
        />
    );
}
