const shellStyle = {
  fontFamily:
    'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
  position: "fixed" as const,
  inset: 0,
  zIndex: 9999,
  height: "100vh",
  margin: 0,
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  color: "#000",
  background: "#fff",
};

const codeStyle = {
  display: "inline-block",
  margin: "0 20px 0 0",
  padding: "0 23px 0 0",
  fontSize: 24,
  fontWeight: 500,
  verticalAlign: "top" as const,
  lineHeight: "49px",
  borderRight: "1px solid rgba(0, 0, 0, .3)",
};

const messageStyle = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "49px",
  margin: 0,
};

export function SignInError() {
  return (
    <div role="alert" className="sign-in-error" style={shellStyle}>
      <title>500: An error occurred while signing in.</title>
      <style>
        {`
          @media (prefers-color-scheme: dark) {
            .sign-in-error {
              color: #fff;
              background: #000;
            }
            .sign-in-error .sign-in-error-code {
              border-right-color: rgba(255, 255, 255, .3);
            }
          }
        `}
      </style>
      <div>
        <h1 className="sign-in-error-code" style={codeStyle}>
          500
        </h1>
        <div style={{ display: "inline-block" }}>
          <h2 style={messageStyle}>An error occurred while signing in.</h2>
        </div>
      </div>
    </div>
  );
}
