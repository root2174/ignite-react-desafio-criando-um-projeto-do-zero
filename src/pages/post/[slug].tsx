import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function getDate(date: string | null): string {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  function getReadingTime(): string {
    const words = post.data.content.reduce((acc, curr) => {
      return acc + RichText.asText(curr.body).split(' ').length;
    }, 0);

    const minutes = Math.ceil(words / 200);
    return `${minutes} min`;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <article>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time className={styles.infoContent}>
              <FiCalendar size={20} />
              {getDate(post.first_publication_date)}
            </time>
            <span className={styles.infoContent}>
              <FiUser size={20} />
              {post.data.author}
            </span>
            <span className={styles.infoContent}>
              <FiClock size={20} />
              {getReadingTime()}
            </span>
          </div>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <p
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [
        'posts.title',
        'posts.subtitle',
        'posts.author',
        'posts.banner',
        'posts.content',
      ],
      pageSize: 20,
    }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    // Which paths (posts) should be rendered during the build process.
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        uid: response.uid,
        data: {
          title: response.data.title,
          subtitle: response.data.subtitle,
          banner: {
            url: response.data.banner.url,
          },
          author: response.data.author,
          content: response.data.content.map(content => ({
            heading: content.heading,
            body: content.body,
          })),
        },
      },
    },
    revalidate: 60 * 60, // 1 hour
  };
};
