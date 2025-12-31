using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using DeceptionApi.Services;

namespace DeceptionApi.Hubs;

public class GameHub : Hub
{
    private readonly GameService _gameService;
    private readonly RoomService _roomService;
    private readonly ILogger<GameHub> _logger;

    public GameHub(GameService gameService, RoomService roomService, ILogger<GameHub> logger)
    {
        _gameService = gameService;
        _roomService = roomService;
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

    public async Task JoinRoom(string roomCode, string playerName)
    {
        _logger.LogInformation("Connection {ConnectionId} joining room {Room} as {Player}", Context.ConnectionId, roomCode, playerName);
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        // Update server state and broadcast to group
        _roomService.JoinRoom(roomCode, playerName);
        var players = _roomService.GetRoom(roomCode)?.Players ?? new List<string>();
        _logger.LogInformation("Room {Room} players after join: {Players}", roomCode, string.Join(",", players));
        await Clients.Group(roomCode).SendAsync("PlayerJoined", new { Name = playerName, Players = players });
    }

    public async Task LeaveRoom(string roomCode, string playerName)
    {
        _logger.LogInformation("Connection {ConnectionId} leaving room {Room} as {Player}", Context.ConnectionId, roomCode, playerName);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        // Note: RoomService does not have Leave implemented; you can add removal logic if desired.
        await Clients.Group(roomCode).SendAsync("PlayerLeft", new { Name = playerName, Players = _roomService.GetRoom(roomCode)?.Players });
    }
}