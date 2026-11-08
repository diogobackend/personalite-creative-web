type LoadingProps = {
  size?: number;
};

export default function Loading({ size = 43 }: LoadingProps) {
  return (
    <div className="flex w-full items-center justify-center py-10">
      <img
        src="/loading.gif"
        alt="Carregando..."
        width={size}
        height={size}
      />
    </div>
  );
}