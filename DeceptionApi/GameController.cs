using Microsoft.AspNetCore.Mvc;
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

    public GameController(RoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet("{code}")]
    public IActionResult GetRoom(string code)
    {
        var room = _roomService.GetRoom(code);
        if (room == null) return NotFound();
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
        var success = _roomService.JoinRoom(request.Code, request.Name);
        if (!success) return NotFound("Room not found");
        return Ok(new { Message = "Joined" });
    }

    [HttpPost("start")]
    public IActionResult StartGame([FromBody] StartGameRequest request)
    {
        var success = _roomService.StartGame(request.Code);
        if (!success) return BadRequest("Game could not be started. Check player count or if game has already started.");
        return Ok(new { Message = "Game started" });
    }
}