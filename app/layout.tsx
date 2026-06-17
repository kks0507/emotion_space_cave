import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마음동굴",
  description:
    "아무도 듣지 않는 동굴. 오늘의 마음을 두고 가면 문학의 한 문장이 메아리가 되어 돌아옵니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Nanum+Myeongjo:wght@400;700&family=Gaegu:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
