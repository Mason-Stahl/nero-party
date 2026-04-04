/**
 * StagePage
 * Main party room. Background: /images/stage.png
 * Most of the app will live here.
 */
export default function StagePage({ hostData }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      overflow: "hidden",
    }}>
      <img
        src="/images/stage.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Party UI goes here */}
      </div>
    </div>
  );
}
