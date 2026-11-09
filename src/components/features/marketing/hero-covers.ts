export const HERO_COVER_STORAGE_KEY = "trashbox-hero-cover";

export interface HeroCover {
  id: string;
  src: string;
  alt: string;
  blurDataURL: string;
  /** Taller frame for phone screens. The wide src stays on larger viewports. */
  mobileSrc?: string;
}

export const HERO_COVERS: readonly HeroCover[] = [
  {
    id: "dusk",
    src: "/images/home/skyline-cover.webp",
    alt: "City skyline at dusk",
    blurDataURL:
      "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAwCdASoUAA4APzmGuVOvKSWisAgB4CcJbACdH8ADBsmfbMk3vdgA/j8r4/Prcul/Yt+3eIh/KiPVYw1vrSQ3PqUzzJcp2/0mAbs9xc3SyjxE+zXB8AAA",
  },
  {
    id: "late-day",
    src: "/images/home/skyline-late-day.jpg",
    alt: "Downtown towers in late-day sun",
    blurDataURL:
      "data:image/jpeg;base64,/9j/wAARCAAIAAwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAWFhYWFhYmFhYmNiYmJjZJNjY2NklcSUlJSUlcb1xcXFxcXG9vb29vb29vhoaGhoaGnJycnJyvr6+vr6+vr6+v/9sAQwEbHR0tKS1MKSlMt3xmfLe3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3/90ABAAB/9oADAMBAAIRAxEAPwCiZIw3zfKpHBNSRyQMCScc8d6o3H+rFJD/AKsVHOyuRH//2Q==",
    mobileSrc: "/images/home/skyline-late-day-tall.webp",
  },
  {
    id: "dallas-day",
    src: "/images/home/skyline-dallas-day.jpg",
    alt: "Dallas skyline on a clear day",
    blurDataURL:
      "data:image/jpeg;base64,/9j/wAARCAAIAAwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAWFhYWFhYmFhYmNiYmJjZJNjY2NklcSUlJSUlcb1xcXFxcXG9vb29vb29vhoaGhoaGnJycnJyvr6+vr6+vr6+v/9sAQwEbHR0tKS1MKSlMt3xmfLe3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3/90ABAAB/9oADAMBAAIRAxEAPwCUX7k4yoqX7d6kZ/z71ip/raH+9RzMXKj/2Q==",
  },
  {
    id: "dallas-dusk",
    src: "/images/home/skyline-dallas-dusk.jpg",
    alt: "Dallas skyline under a pink dusk sky",
    blurDataURL:
      "data:image/jpeg;base64,/9j/wAARCAAIAAwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAWFhYWFhYmFhYmNiYmJjZJNjY2NklcSUlJSUlcb1xcXFxcXG9vb29vb29vhoaGhoaGnJycnJyvr6+vr6+vr6+v/9sAQwEbHR0tKS1MKSlMt3xmfLe3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3/90ABAAB/9oADAMBAAIRAxEAPwCFrppQDEmfr61Ve6RG2uMH0qW07/7wrJv/APj5apuXc//Z",
  },
  {
    id: "night",
    src: "/images/home/skyline-night.jpg",
    alt: "Downtown towers lit at night",
    blurDataURL:
      "data:image/jpeg;base64,/9j/wAARCAAIAAwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAWFhYWFhYmFhYmNiYmJjZJNjY2NklcSUlJSUlcb1xcXFxcXG9vb29vb29vhoaGhoaGnJycnJyvr6+vr6+vr6+v/9sAQwEbHR0tKS1MKSlMt3xmfLe3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3/90ABAAB/9oADAMBAAIRAxEAPwCokxVQgRWIA5OaQJOCxEfU56UxPvD6Ctpfuj6Cm5MnlR//2Q==",
  },
];

export const DEFAULT_HERO_COVER_ID = "late-day";

export function heroCoverFromId(id: string | null | undefined): HeroCover {
  return (
    HERO_COVERS.find((cover) => cover.id === id) ??
    HERO_COVERS.find((cover) => cover.id === DEFAULT_HERO_COVER_ID) ??
    HERO_COVERS[0]
  );
}
