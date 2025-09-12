import axios from "axios";

// Since this file can be used in non-Firebase environments, we cannot import firebase-functions.
// We will use console.log for logging. A more robust solution could involve a logging abstraction.
const logger = console;

const CACHE_TTL_MINUTES = 10;

const removeHtmlTags = (str: string) => str ? str.replace(/<[^>]*>?/gm, '') : '';

export interface NewsArticle {
    title: string;
    url: string;
    summary: string;
}

// A generic Firestore interface to avoid direct dependency on firebase-admin or firebase sdk.
// This makes the logic more portable.
interface GenericFirestore {
    collection(path: string): GenericCollection;
}
interface GenericCollection {
    doc(path: string): GenericDocument;
}
interface GenericDocument {
    get(): Promise<GenericDocumentSnapshot>;
    set(data: any): Promise<any>;
}
interface GenericDocumentSnapshot {
    exists: boolean;
    data(): any;
}
interface GenericTimestamp {
    toMillis(): number;
}


/**
 * Fetches top news articles from Naver Search API.
 * This is a shared logic function that can be used by both Cloud Functions and other server-side code.
 * @param {string} query - The search query.
 * @param {GenericFirestore} firestore - An instance of a Firestore-compatible object.
 * @param {string} naverClientId - The Naver API Client ID.
 * @param {string} naverClientSecret - The Naver API Client Secret.
 * @returns {Promise<NewsArticle[]>} A list of news articles.
 */
export async function fetchNaverNewsLogic(
    query: string,
    firestore: GenericFirestore,
    naverClientId: string,
    naverClientSecret: string
): Promise<NewsArticle[]> {
    if (!query) {
        throw new Error("Missing required parameter: query");
    }
    if (!naverClientId || !naverClientSecret) {
        throw new Error("Naver API credentials are not provided.");
    }

    const cacheKey = query.replace(/[^a-zA-Z0-9가-힣]/g, ""); // Sanitize key
    const cacheRef = firestore.collection("naverNews").doc(cacheKey);
    const now = new Date().getTime();

    try {
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const cacheData = cacheDoc.data()!;
            const updatedAt = (cacheData.updatedAt as GenericTimestamp).toMillis();
            const diffMinutes = (now - updatedAt) / (1000 * 60);

            if (diffMinutes < CACHE_TTL_MINUTES) {
                logger.info(`Returning cached news for query: ${query}`);
                return cacheData.articles as NewsArticle[];
            }
        }

        logger.info(`Cache miss or expired for news query: ${query}. Fetching fresh data.`);
        const url = "https://openapi.naver.com/v1/search/news.json";

        const response = await axios.get(url, {
            params: { query: query, display: 5, sort: 'sim' },
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret,
            },
        });

        if (response.data && response.data.errorMessage) {
            logger.error("Naver API returned an error:", response.data.errorMessage, { query });
            throw new Error(`Naver API Error: ${response.data.errorMessage}`);
        }

        if (response.data && response.data.items) {
            const articles: NewsArticle[] = response.data.items.map((item: any) => ({
                title: removeHtmlTags(item.title),
                url: item.originallink,
                summary: removeHtmlTags(item.description),
            }));

            // This part is tricky because Timestamp objects are specific to the environment.
            // The Cloud Function environment will need to be adapted to create a Timestamp.
            // For now, we'll assume a simple object can be set.
            await cacheRef.set({
                articles,
                updatedAt: { toMillis: () => now }, // Create a compatible object
            });
            logger.info(`Successfully cached news for query: ${query}`);

            return articles;
        } else {
            logger.warn("Naver API call successful but no items were returned.", { query, responseData: response.data });
            return [];
        }

    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            logger.error(`Naver API call failed for query "${query}":`, {
                status: error.response.status,
                data: error.response.data,
            });
            throw new Error(`Failed to fetch news from Naver API. Status: ${error.response.status}`);
        } else {
            logger.error(`An unexpected error occurred in fetchNaverNewsLogic for query "${query}":`, error);
            throw new Error("An unexpected error occurred while fetching news.");
        }
    }
}
