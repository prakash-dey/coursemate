export type CourseChunk = {
  id: string;
  title: string;
  module: string;
  content: string;
};

export const course = {
  title: "Production RAG Fundamentals",
  level: "Intermediate",
  duration: "42 min",
  modules: [
    "1 · Retrieval foundations",
    "2 · Chunking & embeddings",
    "3 · Grounded generation",
    "4 · Evaluation & operations",
  ],
};

// Curated, pre-chunked course notes keep the MVP deterministic and auditable.
export const courseChunks: CourseChunk[] = [
  {
    id: "retrieval-1",
    title: "Why retrieval-augmented generation?",
    module: course.modules[0],
    content: "Retrieval-augmented generation (RAG) adds an evidence lookup step before generation. Instead of relying only on model parameters, the system retrieves relevant passages from an approved knowledge base and places them in the prompt. This improves freshness and lets the product show users which material supported an answer.",
  },
  {
    id: "retrieval-2",
    title: "The retrieval pipeline",
    module: course.modules[0],
    content: "At query time, the system embeds the user's question, compares it with stored chunk embeddings, ranks candidates by similarity, and passes the top relevant chunks to the generator. A similarity threshold should reject weak matches. Top-k controls how many candidates are supplied; more context is not always better because irrelevant passages can distract the model.",
  },
  {
    id: "chunking-1",
    title: "Choosing chunk boundaries",
    module: course.modules[1],
    content: "Good chunks preserve a complete idea. Prefer semantic boundaries such as headings and paragraphs over arbitrary character counts. Chunks that are too small lose context; chunks that are too large combine unrelated ideas and reduce retrieval precision. A modest overlap can preserve facts that cross a boundary, but excessive overlap creates duplicate results.",
  },
  {
    id: "chunking-2",
    title: "Embeddings and similarity",
    module: course.modules[1],
    content: "An embedding maps text to a numeric vector whose geometry represents semantic similarity. Store one vector per chunk along with its source metadata. For normalized vectors, cosine similarity is the dot product. The query and documents must use compatible embedding models and input modes; changing models requires re-embedding the corpus.",
  },
  {
    id: "grounding-1",
    title: "Writing a grounded prompt",
    module: course.modules[2],
    content: "A grounded generation prompt tells the model to answer only from the supplied context, stay concise, and say when the context is insufficient. Source identifiers should remain attached to passages so citations can be mapped back to titles and snippets. The application, not the model, should select and expose the final source records.",
  },
  {
    id: "grounding-2",
    title: "When evidence is missing",
    module: course.modules[2],
    content: "Abstention is a product feature, not a failure. If no chunk clears the retrieval threshold, do not call the generator and do not invent a plausible response. State that the course material does not contain enough evidence, suggest a course-related rephrase, and return an empty source list.",
  },
  {
    id: "evaluation-1",
    title: "Evaluating a RAG system",
    module: course.modules[3],
    content: "Evaluate retrieval separately from generation. Retrieval metrics include recall at k and mean reciprocal rank against a labeled question set. Answer evaluation should measure faithfulness to the retrieved context, answer relevance, and citation correctness. Include adversarial and no-answer questions to verify that the system abstains.",
  },
  {
    id: "operations-1",
    title: "Production observability",
    module: course.modules[3],
    content: "Log query latency, retrieval scores, selected chunk identifiers, model latency, and abstention rate without storing sensitive user text unnecessarily. Version the corpus and embedding model so an answer can be reproduced. Monitor retrieval drift after content or model changes and maintain a small regression question set.",
  },
];
