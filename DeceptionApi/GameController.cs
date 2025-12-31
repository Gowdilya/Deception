using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DeceptionApi.Services;

namespace DeceptionApi.Controllers;

public class PlayerRequest
{
    public string Name { get; set; } = string.Empty;
}

public class JoinRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class StartGameRequest
{
    public string Code { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly RoomService _roomService;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<DeceptionApi.Hubs.GameHub> _hub;
    private readonly Microsoft.Extensions.Logging.ILogger<GameController> _logger;

    public GameController(RoomService roomService, Microsoft.AspNetCore.SignalR.IHubContext<DeceptionApi.Hubs.GameHub> hub, Microsoft.Extensions.Logging.ILogger<GameController> logger)
    {
        _roomService = roomService;
        _hub = hub;
        _logger = logger;
    }

    [HttpGet("{code}")]
    public IActionResult GetRoom(string code)
    {
        var room = _roomService.GetRoom(code);
        if (room == null)
        {
            _logger.LogInformation("GetRoom: room {Code} not found", code);
            return NotFound();
        }

        _logger.LogInformation("GetRoom: room {Code} players: {Players}", code, string.Join(',', room.Players));
        return Ok(room);
    }

    [HttpGet("/api/debug/room/{code}")]
    public IActionResult DebugRoom(string code)
    {
        var room = _roomService.GetRoom(code);
        if (room == null)
        {
            _logger.LogInformation("DebugRoom: room {Code} not found", code);
            return NotFound();
        }
        _logger.LogInformation("DebugRoom dump for {Code}: {@Room}", code, room);
        return Ok(room);
    }

    [HttpPost("create")]
    public IActionResult CreateRoom([FromBody] PlayerRequest request)
    {
        var code = _roomService.CreateRoom(request.Name);
        return Ok(new { Code = code });
    }

    [HttpPost("join")]
    public IActionResult JoinRoom([FromBody] JoinRequest request)
    {
        // Hub-only join: clients should invoke the SignalR hub method `JoinRoom` to join and receive broadcasts.
        // Keep this endpoint for compatibility, but do not update server state here to avoid duplicate broadcasts.
        return BadRequest(new { Message = "Please join via SignalR hub by invoking 'JoinRoom'." });
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartGame([FromBody] StartGameRequest request)
    {
        var success = _roomService.StartGame(request.Code);
        if (!success) return BadRequest("Game could not be started. Check player count or if game has already started.");

        var room = _roomService.GetRoom(request.Code);
        var payload = new { Code = request.Code, Players = room?.Players };
        await _hub.Clients.Group(request.Code).SendAsync("GameStarted", payload);

        return Ok(new { Message = "Game started" });
    }
}