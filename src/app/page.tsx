import { EventList } from "@/components/EventList";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.shell}>
      <header className={`${styles.hero} rise`}>
        <h1 className={styles.brand}>Gestão de Eventos</h1>
        <p className={`${styles.lede} rise rise-delay-1`}>
          Acompanhe as etapas de cada produção em um só lugar — do briefing à
          abertura.
        </p>
        <p className={`${styles.credit} rise rise-delay-1`}>por Nathália Farias</p>
      </header>
      <EventList />
    </main>
  );
}
