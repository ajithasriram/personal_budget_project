import React from 'react';
// import MyChart from '../Chart/MyChart';

function HomePage() {
  return (
    <div className="container">     
      <div className="page-area">
        <form className="form-inline mr-auto" role="search">
            <input className="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search"/>
            <button type="button" className="btn btn-secondary btn-sm">Search</button>
        </form>

        <div>
            <svg className="myDoughnutChart" width="300" height="150"></svg>
        </div>

        <main id="main">
                <div className="text-box" role="article">
                  <section>
                    <h1>Stay on track</h1>
                      <div className="center">
                        <img src="images/sharon-mccutcheon--8a5eJ1-mmQ-unsplash.jpg" alt="A person counting cash" width="200px" height="120px"/>
                      </div>
                      <p>
                        Do you know where you are spending your money? If you really stop to track it down,
                        you would get surprised! Proper budget management depends on real data... and this
                        app will help you with that!
                      </p>
                  </section>
                </div>

                <div className="text-box">
                    <section>
                        <h1>Alerts</h1>
                        <div className="center">
                            <img src="images/jamie-street-33oxtOMk6Ac-unsplash.jpg" alt="Mobile notifications" width="200px" height="150px"/>
                        </div>
                        <p>
                            What if your clothing budget ended? You will get an alert. The goal is to never go over the budget.
                        </p>                    
                    </section>
                </div>
        
                <div className="text-box">
                    <section>
                        <h1>Results</h1>
                        <p>
                            People who stick to a financial plan, budgeting every expense, get out of debt faster!
                            Also, they to live happier lives... since they expend without guilt or fear... 
                            because they know it is all good and accounted for.
                        </p>
                    </section>
                </div>
        
                {/* <div className="text-box">
                    <section>
                        <h1>Chart</h1>
                        <p>
                            <canvas id="myChart" width="300" height="300"></canvas>
                        </p>
                    </section>
                </div> */}
        
                <div className="text-box">
                    <section>
                        <article>
                            <header>
                                <h1>Why is Budgeting so important?</h1>
                            </header>
                            <p>
                                "Budgeting is simply balancing your expenses with your income. If they don't balance and you spend
                                more than you make, you will have a problem. Many people don't realize that they spend more
                                than they earn and slowly sink deeper into debt every year."
                            </p>
                            <a href="https://www.mymoneycoach.ca/budgeting/what-is-a-budget-planning-forecasting" target="_blank" rel="external nofollow" rel="noopener" rel="noreferrer">Read more</a>
                        </article>                   
                    </section>
                </div>
        
                <div className="text-box">
                    <section>
                        <article>
                            <header>
                                <h1>6 Reasons why you need a budget!</h1>
                            </header>
                                <ul className="reasons-for-a-budget">
                                    <li>If you're like most folks, you probably aren't following expert financial advice by crafting and following a budget.</li>
                                    <li>A budget is simply a spending plan that takes into account both current and future income and expenses.</li>
                                    <li>Having a budget keeps your spending in check and makes sure your savings are on track for the future.</li>
                                </ul>                          
                            <a href="https://www.investopedia.com/financial-edge/1109/6-reasons-why-you-need-a-budget.aspx" target="_blank" rel="external nofollow" rel="noopener" rel="noreferrer">Read more</a>
                        </article>                  
                    </section>
                </div>
        
                <div className="text-box">
                    <section>
                        <article>
                            <header>
                                <h1>You need a budget!</h1>
                            </header>
                            <p>
                                Read some success stories that were only possible because they had a budget.
                            </p>
                            <a href="https://www.youneedabudget.com/category/budgeting-success-stories/" target="_blank" rel="external nofollow" rel="noopener" rel="noreferrer">Read more</a>                        
                        </article>
                    </section>
                </div>
        
                <div className="text-box">
                    <section>
                        <article>
                            <header>
                                <h1>They did it! So can you!</h1>
                            </header>
                            <p>
                                Read 4 real life budget success stories. Read more to find out how important it is to maintain a personal budget.
                            </p>
                            <a href="https://blog.mint.com/goals/they-did-it-and-so-can-you-4-real-life-budget-success-stories-0114/" target="_blank" rel="external nofollow" rel="noopener" rel="noreferrer">Read more</a>
                        </article>
                    </section>
                </div>
        </main>
      </div>
    </div>
  );
}

export default HomePage;
