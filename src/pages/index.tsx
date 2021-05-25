/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';

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

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>({} as PostPagination);

  async function loadNextPage(): Promise<void> {
    fetch(`${posts.next_page}`).then(response =>
      response.json().then(responseJson => {
        const results: Post[] = responseJson.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        const newPostsPagination = {
          next_page: responseJson.next_page,
          results: [...posts.results, ...results],
        } as PostPagination;

        setPosts(newPostsPagination);
      })
    );
  }

  useEffect(() => {
    setPosts(postsPagination);
  }, [postsPagination]);

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <section className={styles.container}>
        <header>
          <img src="/Logo.svg" alt="logo" />
        </header>
        <main className={styles.contentPosts}>
          {posts?.results?.map(post => (
            <div key={post.uid} className={styles.post}>
              <Link href={`/post/${post.uid}`}>
                <a>{post.data.title}</a>
              </Link>

              <p>{post.data.subtitle}</p>

              <div>
                <p>
                  <FiCalendar color="#bbbbbb" />
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </p>
                <p>
                  <FiUser color="#bbbbbb" /> {post.data.author}
                </p>
              </div>
            </div>
          ))}
        </main>

        {posts.next_page && (
          <button onClick={loadNextPage} type="button">
            Carregar mais posts
          </button>
        )}
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 20,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
