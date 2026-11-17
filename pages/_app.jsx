import "../styles/globals.css";
import "../styles/personal.css";
import Head from 'next/head';
export default function App({ Component, pageProps }) {
  return <><Head><link rel="icon" href="/favicon.ico" sizes="any"/><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/></Head><Component {...pageProps} /></>;
}
