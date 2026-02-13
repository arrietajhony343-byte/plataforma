import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/storage/logo.png"
            alt="I.P. Emprendedores del Saber"
        />
    );
}
