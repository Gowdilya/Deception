using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using DeceptionApi.Services;

namespace DeceptionApi.Hubs;

public class GameHub : Hub
{
    private readonly GameService _gameService;
    private readonly ILogger<GameHub> _logger;

    public GameHub(GameService gameService, ILogger<GameHub> logger)
    {
        _gameService = gameService;
        _logger = logger;
    }

    public async Task SendMessage(string user, string message)
    {
        _logger.LogInformation("Message received from {User}: {Message}", user, message);
        var state = _gameService.GetCurrentState();
        await Clients.All.SendAsync("ReceiveMessage", user, $"{message} [Game State: {state}]");
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }
}