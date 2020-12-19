import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import * as d3 from 'd3';
import { DataService } from '../data.service';

@Component({
  selector: 'pb-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  // This is for Chart js
  public dataChart = {
    datasets: [{
      data: [],
      backgroundColor: [],
    }],

    labels: []
  };


  private svg;
  private margin = 50;
  private width = 600;
  private height = 500;
  private radius = Math.min(this.width, this.height) / 2 - this.margin;
  private colors;

  public data;

  constructor(public dataService: DataService) {

  }

  ngOnInit(): void {

    this.getData();
  }

  getData() {
    this.dataService.getData().then(function (res) {
      console.log(res.data)
      if (res.data.user_budget.length == 0) {
        alert('Welcome to the Personal Budget app. As a first step please add your budgets in the page opened');
        window.location.href = '/budget';
      } else {
        window.location.href = '/budget-detail'
      }
    }).catch(function (err) {
      alert(err.response.data.error);
    });
  }
}
