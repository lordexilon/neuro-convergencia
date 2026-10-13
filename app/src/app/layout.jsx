import './globals.css';

export const metadata = {
  title: 'Neuro Convergencia · Micro-tecnología de Autoconocimiento',
  description: 'Revisa tus reacciones cotidianas en menos de 2 minutos. Distingue hechos objetivos de interpretaciones y autorregula tu energía con Kabalá práctica y neurocomportamiento.',
  metadataBase: new URL('https://neuro-convergencia.vercel.app'),
  openGraph: {
    title: 'Neuro Convergencia · El Mapa del Neurocomportamiento',
    description: 'Pausa, distingue hechos de juicios y autorregula tu respuesta en 2 minutos. Basado en las 3 dimensiones del ser y Kabalá práctica.',
    url: 'https://neuro-convergencia.vercel.app',
    siteName: 'Neuro Convergencia',
    images: [
      {
        url: 'https://i.ytimg.com/vi/qhrWJ07YRuk/hqdefault.jpg',
        width: 480,
        height: 360,
        alt: 'Neuro Convergencia - Video de presentación'
      }
    ],
    locale: 'es_LA',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neuro Convergencia · Autoconocimiento Reflexivo',
    description: 'Transforma reacciones automáticas en respuestas serenas y conscientes en 2 minutos.',
    images: ['https://i.ytimg.com/vi/qhrWJ07YRuk/hqdefault.jpg']
  }
};

export default function Layout({children}) {
  return <html lang="es"><body>{children}</body></html>;
}
