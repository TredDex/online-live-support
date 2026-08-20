type MiniChartProps = {
  positive?: boolean;
};

export default function MiniChart({
  positive = true,
}: MiniChartProps) {

  return (
    <svg
      className="mini-chart"
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >

      <polyline
        points={
          positive
            ? "0,30 15,25 30,28 45,15 60,20 75,10 90,14 120,5"
            : "0,8 15,15 30,12 45,25 60,20 75,30 90,24 120,35"
        }
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

    </svg>
  );
}
