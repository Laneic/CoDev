
function App() {
  async function sendMessage() {
    const response = await fetch("api/echo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Hello, backend!",
        status: "ok"
      })
    });

    const result = await response.json();
    console.log(result);
  }

  return (
    <div>
      <h1>CoDev</h1>
      <button onClick={sendMessage}>
        Send message
      </button>
    </div>
  );
}

export default App;
