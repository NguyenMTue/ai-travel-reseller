const DEFAULT_CHUNK_SIZE = 2_000;

export type EmbeddableProduct = {
  name: string;
  category: string | null;
  description: string | null;
  original_price: number | null;
  sale_price: number | null;
};

export function buildProductEmbeddingContent(product: EmbeddableProduct): string {
  return [
    `Tên sản phẩm: ${product.name}`,
    `Danh mục: ${product.category ?? "Không xác định"}`,
    `Mô tả: ${product.description ?? "Không có mô tả"}`,
    `Giá gốc: ${product.original_price ?? "Không xác định"} VNĐ`,
    `Giá bán: ${product.sale_price ?? "Không xác định"} VNĐ`,
  ].join("\n");
}

export function chunkEmbeddingContent(
  content: string,
  maxCharacters = DEFAULT_CHUNK_SIZE,
): string[] {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 1) {
    throw new Error("maxCharacters must be a positive integer");
  }

  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Product embedding content cannot be empty");
  }

  const chunks: string[] = [];
  let current = "";

  const append = (segment: string) => {
    const candidate = current ? `${current}\n${segment}` : segment;

    if (candidate.length <= maxCharacters) {
      current = candidate;
      return;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (segment.length <= maxCharacters) {
      current = segment;
      return;
    }

    const words = segment.split(" ");
    for (const word of words) {
      const wordCandidate = current ? `${current} ${word}` : word;

      if (wordCandidate.length <= maxCharacters) {
        current = wordCandidate;
      } else {
        if (current) {
          chunks.push(current);
        }
        current = word;
      }
    }
  };

  for (const line of lines) {
    append(line);
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
