import { GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { spawn } from 'child_process';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  function getDate(date: string | null): string {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  async function loadMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const morePosts = await response.json();
    setPosts([...posts, ...morePosts.results]);
    setNextPage(morePosts.next_page);
  }

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <Image
          src="/images/Logo.svg"
          width={238.62}
          height={25.63}
          alt="logo"
        />
      </div>
      {posts.map(post => (
        <div className={styles.post} key={post.uid}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
              <p className={styles.subtitle}>{post.data.subtitle}</p>
              <div className={styles.footer}>
                <time className={styles.footerContent}>
                  <FiCalendar size={20} />
                  {getDate(post.first_publication_date)}
                </time>
                <span className={styles.footerContent}>
                  <FiUser size={20} />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        </div>
      ))}
      {nextPage && (
        <button
          onClick={loadMorePosts}
          type="button"
          className={styles.loadMore}
        >
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [
        'posts.title',
        'posts.subtitle',
        'posts.author',
        'posts.banner',
        'posts.content',
      ],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
    revalidate: 60 * 60, // 1 hour
  };
};
