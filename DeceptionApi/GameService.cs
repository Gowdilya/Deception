namespace DeceptionApi.Services;

public class GameService
{
    private string _state = "Waiting for players...";

    // This is where we will store players, roles, and game phases later.
    public string GetCurrentState()
    {
        return _state;
    }

    public void StartGame()
    {
        _state = "Game Started! (Roles assigned)";
    }
}