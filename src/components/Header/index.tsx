import Image from 'next/image';
import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={styles.container}>
      <Link href="/">
        <a className={styles.logo}>
          <Image
            src="/images/Logo.svg"
            width={238.62}
            height={25.63}
            alt="logo"
          />
        </a>
      </Link>
    </div>
  );
}
